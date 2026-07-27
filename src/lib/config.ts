/**
 * Single source of truth for site-wide constants. Nothing here should ever
 * be re-hardcoded elsewhere — import from this file instead.
 */

export const SITE_NAME = "NIMSA South East Pageantry";
export const SITE_TAGLINE = "An Evening of Elegance, Culture & Crowned Excellence";

/** ₦100 buys 1 vote. Change this single value to re-price the whole platform. */
export const NAIRA_PER_VOTE = 100;

export const CURRENCY = "NGN" as const;

/** Guardrails on a single checkout so one transaction can't be pathological. */
export const MIN_VOTES_PER_ORDER = 1;
export const MAX_VOTES_PER_ORDER = 2000;

/** Quick-pick vote quantities shown as buttons on the vote page. */
export const VOTE_QUANTITY_PRESETS = [1, 5, 10, 25, 50, 100] as const;

/** Max size for a contestant photo uploaded from /admin. */
export const MAX_PHOTO_UPLOAD_BYTES = 4.5 * 1024 * 1024; // 4.5MB — Vercel's serverless request body limit

/** How often the client polls for fresh vote counts / voting-window state. */
export const CONTESTANTS_POLL_INTERVAL_MS = 7000;
export const SETTINGS_POLL_INTERVAL_MS = 20000;
export const PAYMENT_STATUS_POLL_INTERVAL_MS = 3000;

/** Admin session cookie lifetime. */
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export function nairaFromVotes(votes: number): number {
  return votes * NAIRA_PER_VOTE;
}

export function koboFromVotes(votes: number): number {
  return nairaFromVotes(votes) * 100;
}

export function formatNaira(amountNaira: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amountNaira);
}
