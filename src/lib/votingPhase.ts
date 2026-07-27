/**
 * Pure, isomorphic (client + server safe) helpers for deriving the current
 * voting phase from the votingStartsAt / votingEndsAt window. No Node-only
 * imports here so this can be used directly in client components too.
 */

export type VotingPhase = "before" | "live" | "ended";

export interface VotingWindow {
  votingStartsAt: string | Date;
  votingEndsAt: string | Date;
}

export function getVotingPhase(window: VotingWindow, now: Date = new Date()): VotingPhase {
  const start = new Date(window.votingStartsAt).getTime();
  const end = new Date(window.votingEndsAt).getTime();
  const t = now.getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return "before";
  if (t < start) return "before";
  if (t > end) return "ended";
  return "live";
}

/** Milliseconds remaining until the next transition point (start or end). */
export function msUntilNextTransition(window: VotingWindow, now: Date = new Date()): number {
  const phase = getVotingPhase(window, now);
  const start = new Date(window.votingStartsAt).getTime();
  const end = new Date(window.votingEndsAt).getTime();
  const t = now.getTime();

  if (phase === "before") return Math.max(0, start - t);
  if (phase === "live") return Math.max(0, end - t);
  return 0;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function toCountdownParts(ms: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}
