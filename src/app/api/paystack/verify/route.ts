import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { Transaction } from "@/lib/models/Transaction";
import { verifyAndCreditTransaction } from "@/lib/creditTransaction";

export const dynamic = "force-dynamic";

/**
 * Status check used by /vote/success to show payment progress. Normally the
 * webhook (the fast, primary path) has already resolved the transaction by
 * the time this is polled. But if a transaction is still "pending" here, we
 * also actively re-verify with Paystack ourselves — this is what makes the
 * app resilient to a webhook that never arrives (misconfigured webhook URL,
 * or simply unreachable, e.g. Paystack's servers cannot reach `localhost`
 * during local development). Without this fallback, a genuinely successful
 * payment could leave the voter staring at "Confirming your payment…"
 * forever, with votes never credited. verifyAndCreditTransaction still does
 * a full independent server-side verification against Paystack before
 * crediting anything, so this doesn't weaken the "never trust the client"
 * invariant — it just adds a second, idempotent trigger for the same
 * verified crediting logic.
 */
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  }

  await connectToDatabase();

  let transaction = await Transaction.findOne({ reference }).lean();
  if (!transaction) {
    return NextResponse.json({ error: "Unknown reference." }, { status: 404 });
  }

  if (transaction.status === "pending") {
    await verifyAndCreditTransaction(reference);
    // Re-fetch in case the line above just updated it; falls back to the
    // original (still-pending) record in the astronomically unlikely case
    // it went missing between the two queries.
    transaction = (await Transaction.findOne({ reference }).lean()) ?? transaction;
  }

  const contestant = await Contestant.findById(transaction.contestantId).lean();

  return NextResponse.json({
    status: transaction.status,
    votesCredited: transaction.votesCredited,
    amountPaid: transaction.amountPaid,
    contestantName: contestant?.name ?? null,
    contestantId: transaction.contestantId.toString(),
  });
}
