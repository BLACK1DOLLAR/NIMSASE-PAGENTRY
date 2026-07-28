"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useVotingPhase } from "@/lib/useVotingPhase";
import { CONTESTANTS_POLL_INTERVAL_MS } from "@/lib/config";
import ContestantCard from "@/components/ContestantCard";
import Reveal from "@/components/Reveal";
import type { ContestantDTO } from "@/types";

interface ContestantGridProps {
  initialContestants: ContestantDTO[];
}

/**
 * Polls /api/contestants every few seconds so vote counts update live for
 * every visitor without a page refresh, per the "real-time" requirement.
 * Seeded with server-rendered `initialContestants` so there's no
 * flash-of-empty-state on first paint.
 */
export default function ContestantGrid({ initialContestants }: ContestantGridProps) {
  const { data } = useSWR<{ contestants: ContestantDTO[] }>("/api/contestants", fetcher, {
    refreshInterval: CONTESTANTS_POLL_INTERVAL_MS,
    fallbackData: { contestants: initialContestants },
    revalidateOnFocus: true,
  });

  const { phase } = useVotingPhase();
  const contestants = data?.contestants ?? initialContestants;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
      {contestants.map((contestant, i) => (
        <Reveal key={contestant.id} className="h-full" delayMs={(i % 4) * 80}>
          <ContestantCard contestant={contestant} votingOpen={phase === "live"} />
        </Reveal>
      ))}
    </div>
  );
}
