import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { serializeContestant } from "@/lib/serialize";
import Hero from "@/components/Hero";
import ContestantGrid from "@/components/ContestantGrid";
import Reveal from "@/components/Reveal";
import GoldDivider from "@/components/GoldDivider";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectToDatabase();
  const contestants = (await Contestant.find().sort({ name: 1 })).map(serializeContestant);

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow">The Nominees</p>
          <h2 className="mt-3 font-display text-3xl text-ink-50 sm:text-4xl">Meet This Year&apos;s Couples</h2>
          <GoldDivider className="mt-6" />
        </Reveal>

        {contestants.length === 0 ? (
          <p className="text-center font-body text-ink-400">
            Contestants have not been added yet. Run the seed script or add them from /admin.
          </p>
        ) : (
          <ContestantGrid initialContestants={contestants} />
        )}
      </section>
    </>
  );
}
