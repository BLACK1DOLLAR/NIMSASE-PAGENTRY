import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { serializeContestant } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** Public: list contestants with live vote counts. Polled by the homepage/results grid. */
export async function GET() {
  await connectToDatabase();
  const contestants = await Contestant.find().sort({ name: 1 });
  return NextResponse.json({
    contestants: contestants.map(serializeContestant),
  });
}
