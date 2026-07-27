"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { SETTINGS_POLL_INTERVAL_MS } from "@/lib/config";
import { getVotingPhase, msUntilNextTransition, toCountdownParts, type VotingPhase } from "@/lib/votingPhase";
import type { VotingSettingsDTO } from "@/types";

interface UseVotingPhaseResult {
  phase: VotingPhase;
  settings: VotingSettingsDTO | undefined;
  countdown: ReturnType<typeof toCountdownParts>;
  isLoading: boolean;
}

/**
 * Shared client hook: fetches the voting window (deduped + cached across all
 * components via SWR's shared cache key) and ticks a 1s clock so the
 * countdown + vote-gating state stay in sync everywhere on the page.
 */
export function useVotingPhase(): UseVotingPhaseResult {
  const { data, isLoading } = useSWR<{ settings: VotingSettingsDTO }>("/api/settings", fetcher, {
    refreshInterval: SETTINGS_POLL_INTERVAL_MS,
    revalidateOnFocus: true,
  });

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const settings = data?.settings;
  const phase = settings ? getVotingPhase(settings, now) : "before";
  const countdown = settings ? toCountdownParts(msUntilNextTransition(settings, now)) : toCountdownParts(0);

  return { phase, settings, countdown, isLoading };
}
