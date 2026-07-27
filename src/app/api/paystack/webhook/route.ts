import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { Transaction } from "@/lib/models/Transaction";
import { isValidPaystackSignature, verifyPaystackTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

/**
 * The ONLY place vote counts are ever incremented. Paystack calls this after
 * a charge event. Two independent safeguards before a single vote is
 * credited:
 *
 *  1. Signature check — the raw body must be HMAC-SHA512 signed with our
 *     Paystack secret key, proving the call actually came from Paystack.
 *  2. Server-to-server re-verification — we call Paystack's own /verify
 *     endpoint rather than trusting the webhook payload's `status`/`amount`
 *     fields, in case those were tampered with in transit.
 *
 * Idempotency is enforced at the database layer: the findOneAndUpdate below
 * only flips a transaction from non-"success" to "success" once. Paystack
 * retries webhooks aggressively (e.g. if we're slow to 200), so this must be
 * atomic rather than a read-then-write check.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!isValidPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const reference = event.data?.reference;
  if (!reference) {
    // Nothing actionable — acknowledge so Paystack doesn't keep retrying.
    return NextResponse.json({ received: true });
  }

  await connectToDatabase();

  try {
    if (event.event === "charge.success") {
      await handleChargeSuccess(reference);
    } else if (event.event === "charge.failed") {
      await Transaction.findOneAndUpdate(
        { reference, status: "pending" },
        { status: "failed" }
      );
    }
    // Other event types (e.g. transfer events) are intentionally ignored.
  } catch (err) {
    console.error("Paystack webhook processing error:", err);
    // Still 200 the request: Paystack will retry on non-2xx, and retrying a
    // Paystack-side API error (e.g. verify endpoint hiccup) indefinitely
    // isn't useful. The transaction stays "pending" for manual reconciliation.
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

async function handleChargeSuccess(reference: string) {
  // Independent confirmation straight from Paystack — never trust the
  // webhook body's own status/amount fields for crediting votes.
  const verified = await verifyPaystackTransaction(reference);
  if (verified.status !== "success") return;

  // Atomic guard: only the first call that finds status != "success" wins
  // the update, so concurrent/duplicate webhook deliveries can't double-credit.
  const transaction = await Transaction.findOneAndUpdate(
    { reference, status: { $ne: "success" } },
    { status: "success" },
    { new: true }
  );

  if (!transaction) {
    // Either unknown reference, or this reference was already credited by a
    // previous delivery of the same webhook — idempotent no-op either way.
    return;
  }

  if (verified.amount !== transaction.amountPaid) {
    console.error(
      `Amount mismatch for reference ${reference}: paid ${verified.amount} kobo, expected ${transaction.amountPaid} kobo. Votes NOT credited; flagged for manual review.`
    );
    await Transaction.findByIdAndUpdate(transaction._id, { status: "failed" });
    return;
  }

  await Contestant.findByIdAndUpdate(transaction.contestantId, {
    $inc: { voteCount: transaction.votesCredited },
  });
}
