import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { serializeContestant } from "@/lib/serialize";
import ResultsClient from "./ResultsClient";
import GoldDivider from "@/components/GoldDivider";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  await connectToDatabase();
  const contestants = (await Contestant.find().sort({ voteCount: -1, name: 1 })).map(serializeContestant);

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal className="mb-12 text-center">
        <p className="eyebrow">Live Standings</p>
        <h1 className="mt-3 font-display text-3xl text-ink-50 sm:text-4xl">Leaderboard</h1>
        <GoldDivider className="mt-6" />
      </Reveal>

      <ResultsClient initialContestants={contestants} />
    </section>
  );
}
