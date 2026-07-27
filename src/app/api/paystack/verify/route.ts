import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { Transaction } from "@/lib/models/Transaction";

export const dynamic = "force-dynamic";

/**
 * Read-only status check used by /vote/success to show payment progress.
 * This deliberately does NOT talk to Paystack or credit any votes itself —
 * it only reports whatever the webhook has already recorded in the DB, so
 * the "webhook is the sole source of truth for votes" invariant holds even
 * if a voter refreshes this page a hundred times.
 */
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  }

  await connectToDatabase();
  const transaction = await Transaction.findOne({ reference }).lean();
  if (!transaction) {
    return NextResponse.json({ error: "Unknown reference." }, { status: 404 });
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
