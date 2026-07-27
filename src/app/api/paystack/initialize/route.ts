import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { Transaction } from "@/lib/models/Transaction";
import { initializePaystackTransaction } from "@/lib/paystack";
import { getSettings } from "@/lib/settings";
import { getVotingPhase } from "@/lib/votingPhase";
import { koboFromVotes, MAX_VOTES_PER_ORDER, MIN_VOTES_PER_ORDER } from "@/lib/config";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Starts a Paystack checkout for N votes on a contestant. This route never
 * touches voteCount — it only records a "pending" transaction. Votes are
 * only ever credited by /api/paystack/webhook after Paystack confirms
 * payment, so nothing here is trusted for the actual vote tally.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { contestantId, votes, email } = (body ?? {}) as {
    contestantId?: string;
    votes?: number;
    email?: string;
  };

  if (!contestantId || !mongoose.isValidObjectId(contestantId)) {
    return NextResponse.json({ error: "A valid contestantId is required." }, { status: 400 });
  }

  const voteCount = Number(votes);
  if (!Number.isInteger(voteCount) || voteCount < MIN_VOTES_PER_ORDER || voteCount > MAX_VOTES_PER_ORDER) {
    return NextResponse.json(
      { error: `votes must be a whole number between ${MIN_VOTES_PER_ORDER} and ${MAX_VOTES_PER_ORDER}.` },
      { status: 400 }
    );
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required for your payment receipt." }, { status: 400 });
  }

  await connectToDatabase();

  const settings = await getSettings();
  const phase = getVotingPhase({ votingStartsAt: settings.votingStartsAt, votingEndsAt: settings.votingEndsAt });
  if (phase !== "live") {
    const message =
      phase === "before" ? "Voting has not opened yet." : "Voting has ended. Thank you for your support.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const contestant = await Contestant.findById(contestantId);
  if (!contestant) {
    return NextResponse.json({ error: "Contestant not found." }, { status: 404 });
  }

  const amountKobo = koboFromVotes(voteCount);
  const reference = `nimsa_${crypto.randomBytes(12).toString("hex")}`;

  const transaction = await Transaction.create({
    reference,
    contestantId: contestant._id,
    amountPaid: amountKobo,
    votesCredited: voteCount,
    status: "pending",
    customerEmail: email,
  });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

  try {
    const result = await initializePaystackTransaction({
      email,
      amountKobo,
      reference,
      callbackUrl: `${origin}/vote/success?reference=${reference}`,
      metadata: {
        contestantId: contestant._id.toString(),
        contestantName: contestant.name,
        votes: voteCount,
      },
    });

    return NextResponse.json({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    });
  } catch (err) {
    // Roll back the pending transaction record if Paystack never actually
    // created the checkout session, so it doesn't linger as noise.
    await Transaction.deleteOne({ _id: transaction._id });
    const message = err instanceof Error ? err.message : "Failed to start checkout.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
