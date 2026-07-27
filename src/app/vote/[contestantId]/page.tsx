import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { serializeContestant } from "@/lib/serialize";
import VoteClient from "./VoteClient";

export const dynamic = "force-dynamic";

interface VotePageProps {
  params: { contestantId: string };
}

export default async function VotePage({ params }: VotePageProps) {
  if (!mongoose.isValidObjectId(params.contestantId)) {
    notFound();
  }

  await connectToDatabase();
  const contestant = await Contestant.findById(params.contestantId);
  if (!contestant) {
    notFound();
  }

  return <VoteClient contestant={serializeContestant(contestant)} />;
}
