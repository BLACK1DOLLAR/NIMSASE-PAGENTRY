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
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {contestants.map((contestant, i) => (
        <Reveal key={contestant.id} delayMs={(i % 3) * 120}>
          <ContestantCard contestant={contestant} votingOpen={phase === "live"} />
        </Reveal>
      ))}
    </div>
  );
}
