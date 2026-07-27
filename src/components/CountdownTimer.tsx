"use client";

import { useVotingPhase } from "@/lib/useVotingPhase";

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="frame-card flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
        <span className="font-display text-2xl text-gold-200 sm:text-3xl">{String(value).padStart(2, "0")}</span>
      </div>
      <span className="mt-2 font-body text-[0.65rem] uppercase tracking-[0.25em] text-ink-300">{label}</span>
    </div>
  );
}

export default function CountdownTimer() {
  const { phase, countdown, isLoading } = useVotingPhase();

  if (isLoading) {
    return <div className="h-24 w-full max-w-md animate-pulse rounded-2xl bg-ink-800/50" />;
  }

  if (phase === "ended") {
    return (
      <div className="frame-card px-8 py-5 text-center">
        <p className="font-display text-xl text-gold-200 sm:text-2xl">Voting has ended</p>
        <p className="mt-1 font-body text-sm text-ink-300">Thank you to everyone who cast a vote.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="eyebrow">{phase === "before" ? "Voting opens in" : "Voting closes in"}</p>
      <div className="flex items-center gap-3 sm:gap-5">
        <Unit value={countdown.days} label="Days" />
        <span className="pb-6 font-display text-2xl text-gold-400/60">:</span>
        <Unit value={countdown.hours} label="Hours" />
        <span className="pb-6 font-display text-2xl text-gold-400/60">:</span>
        <Unit value={countdown.minutes} label="Min" />
        <span className="pb-6 font-display text-2xl text-gold-400/60">:</span>
        <Unit value={countdown.seconds} label="Sec" />
      </div>
    </div>
  );
}
