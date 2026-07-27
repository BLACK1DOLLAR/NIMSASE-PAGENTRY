import { Contestant } from "@/lib/models/Contestant";
import { Transaction } from "@/lib/models/Transaction";
import { verifyPaystackTransaction } from "@/lib/paystack";

/** Paystack statuses that mean "this charge will never succeed" — safe to mark failed and stop polling. */
const TERMINAL_FAILURE_STATUSES = new Set(["failed", "abandoned", "reversed"]);

/**
 * The ONLY place vote counts are ever incremented. Does an independent
 * server-to-server re-verification against Paystack (never trusting a
 * webhook payload or client redirect on their own) before crediting a
 * single vote.
 *
 * Called from two places:
 *  1. The webhook handler (the primary, fast path — Paystack calls us the
 *     moment a charge succeeds).
 *  2. The /vote/success polling endpoint, as a fallback for when the
 *     webhook never arrives (misconfigured webhook URL, or simply
 *     unreachable — e.g. Paystack's servers cannot reach `localhost`
 *     during local development). Without this fallback, a real successful
 *     payment could leave its transaction stuck on "pending" forever.
 *
 * Idempotent: the findOneAndUpdate below only flips a transaction from
 * non-"success" to "success" once, so it's safe to call this repeatedly /
 * concurrently from both call sites without double-crediting.
 */
export async function verifyAndCreditTransaction(reference: string): Promise<"success" | "failed" | "pending"> {
  const existing = await Transaction.findOne({ reference }).lean();
  if (!existing) return "pending"; // unknown reference — caller decides how to handle this

  if (existing.status === "success" || existing.status === "failed") {
    return existing.status;
  }

  let verified: Awaited<ReturnType<typeof verifyPaystackTransaction>>;
  try {
    verified = await verifyPaystackTransaction(reference);
  } catch (err) {
    // Transient Paystack API/network hiccup — leave the transaction pending
    // rather than throwing, so a poll or webhook retry can succeed later
    // instead of surfacing a hard error for what may still resolve fine.
    console.error(`verifyPaystackTransaction failed for reference ${reference}:`, err);
    return "pending";
  }

  if (TERMINAL_FAILURE_STATUSES.has(verified.status)) {
    await Transaction.findOneAndUpdate({ reference, status: "pending" }, { status: "failed" });
    return "failed";
  }

  if (verified.status !== "success") {
    return "pending"; // still in progress on Paystack's side (e.g. "ongoing", "queued")
  }

  // Atomic guard: only the first caller that finds status != "success" wins
  // the update, so concurrent webhook + polling calls can't double-credit.
  const transaction = await Transaction.findOneAndUpdate(
    { reference, status: { $ne: "success" } },
    { status: "success" },
    { new: true },
  );

  if (!transaction) {
    // Already credited by a concurrent/previous call — idempotent no-op.
    return "success";
  }

  if (verified.amount !== transaction.amountPaid) {
    console.error(
      `Amount mismatch for reference ${reference}: paid ${verified.amount} kobo, expected ${transaction.amountPaid} kobo. Votes NOT credited; flagged for manual review.`,
    );
    await Transaction.findByIdAndUpdate(transaction._id, { status: "failed" });
    return "failed";
  }

  await Contestant.findByIdAndUpdate(transaction.contestantId, {
    $inc: { voteCount: transaction.votesCredited },
  });

  return "success";
}
