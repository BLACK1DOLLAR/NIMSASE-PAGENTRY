"use client";

import useSWR from "swr";
import Image from "next/image";
import { fetcher } from "@/lib/fetcher";
import { CONTESTANTS_POLL_INTERVAL_MS } from "@/lib/config";
import Reveal from "@/components/Reveal";
import type { ContestantDTO } from "@/types";

const RANK_STYLES = [
  "border-gold-400/60 bg-gold-400/10 text-gold-200",
  "border-ink-300/40 bg-ink-300/10 text-ink-100",
  "border-burgundy-300/50 bg-burgundy-400/10 text-burgundy-100",
];

export default function ResultsClient({ initialContestants }: { initialContestants: ContestantDTO[] }) {
  const { data } = useSWR<{ contestants: ContestantDTO[] }>("/api/contestants", fetcher, {
    refreshInterval: CONTESTANTS_POLL_INTERVAL_MS,
    fallbackData: { contestants: initialContestants },
  });

  const contestants = [...(data?.contestants ?? initialContestants)].sort((a, b) => b.voteCount - a.voteCount);
  const totalVotes = contestants.reduce((sum, c) => sum + c.voteCount, 0);
  const maxVotes = Math.max(1, ...contestants.map((c) => c.voteCount));

  return (
    <div className="flex flex-col gap-4">
      {contestants.map((contestant, i) => {
        const share = totalVotes > 0 ? (contestant.voteCount / totalVotes) * 100 : 0;
        const widthPct = (contestant.voteCount / maxVotes) * 100;
        return (
          <Reveal key={contestant.id} delayMs={i * 60}>
            <div className="frame-card flex items-center gap-4 p-4 sm:p-5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-display text-sm ${
                  RANK_STYLES[i] ?? "border-ink-500/40 bg-ink-800/50 text-ink-300"
                }`}
              >
                {i + 1}
              </div>

              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gold-400/20">
                <Image src={contestant.photoUrl} alt={contestant.name} fill className="object-cover" sizes="56px" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-display text-base text-ink-50 sm:text-lg">
                    {contestant.name}
                    {contestant.msaChapter && (
                      <span className="ml-2 font-body text-[0.65rem] uppercase tracking-[0.15em] text-gold-300/70">
                        {contestant.msaChapter}
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 font-body text-sm text-gold-200">
                    {contestant.voteCount.toLocaleString("en-NG")} votes
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-700/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-all duration-700"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <p className="mt-1 font-body text-xs text-ink-400">{share.toFixed(1)}% of all votes</p>
              </div>
            </div>
          </Reveal>
        );
      })}

      {contestants.length === 0 && (
        <p className="text-center font-body text-ink-400">No contestants yet.</p>
      )}
    </div>
  );
}
