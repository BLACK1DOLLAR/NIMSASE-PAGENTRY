"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useVotingPhase } from "@/lib/useVotingPhase";
import {
  MAX_VOTES_PER_ORDER,
  MIN_VOTES_PER_ORDER,
  NAIRA_PER_VOTE,
  VOTE_QUANTITY_PRESETS,
  formatNaira,
  nairaFromVotes,
} from "@/lib/config";
import GoldDivider from "@/components/GoldDivider";
import type { ContestantDTO } from "@/types";

interface VoteClientProps {
  contestant: ContestantDTO;
}

export default function VoteClient({ contestant }: VoteClientProps) {
  const { phase, isLoading } = useVotingPhase();
  const [votes, setVotes] = useState(10);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const votingOpen = phase === "live";
  const total = formatNaira(nairaFromVotes(votes));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!Number.isInteger(votes) || votes < MIN_VOTES_PER_ORDER || votes > MAX_VOTES_PER_ORDER) {
      setError(`Please choose between ${MIN_VOTES_PER_ORDER} and ${MAX_VOTES_PER_ORDER} votes.`);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address for your receipt.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestantId: contestant.id, votes, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong starting checkout.");
      }
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
      <Link href="/" className="mb-8 inline-block font-body text-xs uppercase tracking-[0.2em] text-gold-300 hover:text-gold-200">
        &larr; Back to nominees
      </Link>

      <div className="frame-card grid grid-cols-1 overflow-hidden sm:grid-cols-2">
        <div className="relative aspect-[4/5] sm:aspect-auto">
          <Image src={contestant.photoUrl} alt={contestant.name} fill className="object-cover" sizes="(min-width: 640px) 400px, 100vw" />
        </div>

        <div className="flex flex-col justify-center gap-6 p-6 sm:p-10">
          <div>
            <p className="eyebrow">Vote for</p>
            <h1 className="mt-2 font-display text-3xl text-ink-50">{contestant.name}</h1>
            {contestant.msaChapter && (
              <p className="mt-1 font-body text-xs uppercase tracking-[0.15em] text-gold-300/80">
                {contestant.msaChapter}
              </p>
            )}
            <p className="mt-2 font-body text-sm text-ink-300">{contestant.bio}</p>
          </div>

          <GoldDivider className="!justify-start" />

          {!isLoading && !votingOpen && (
            <div className="rounded-xl border border-burgundy-300/40 bg-burgundy-900/40 px-4 py-3 font-body text-sm text-burgundy-100">
              {phase === "before" ? "Voting has not opened yet — check back soon." : "Voting has ended. Thank you for your support."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-ink-300">
                Number of votes
              </label>
              <div className="mb-3 flex flex-wrap gap-2">
                {VOTE_QUANTITY_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setVotes(preset)}
                    className={`rounded-full border px-4 py-1.5 font-body text-sm transition-colors ${
                      votes === preset
                        ? "border-gold-400 bg-gold-400/15 text-gold-200"
                        : "border-ink-500/40 text-ink-300 hover:border-gold-400/40"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={MIN_VOTES_PER_ORDER}
                max={MAX_VOTES_PER_ORDER}
                value={votes}
                onChange={(e) => setVotes(Number(e.target.value))}
                className="field-input"
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-ink-300">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
              />
              <p className="mt-1 font-body text-xs text-ink-500">Your Paystack receipt is sent here.</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gold-400/15 bg-ink-900/50 px-4 py-3">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-ink-300">
                ₦{NAIRA_PER_VOTE} &times; {votes || 0}
              </span>
              <span className="font-display text-xl text-gold-200">{total}</span>
            </div>

            {error && <p className="font-body text-sm text-burgundy-200">{error}</p>}

            <button type="submit" disabled={!votingOpen || submitting} className="btn-gold w-full">
              {submitting ? "Redirecting to secure checkout…" : "Proceed to Payment"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
