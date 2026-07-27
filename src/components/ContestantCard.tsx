import Image from "next/image";
import Link from "next/link";
import type { ContestantDTO } from "@/types";

interface ContestantCardProps {
  contestant: ContestantDTO;
  votingOpen: boolean;
  rank?: number;
}

export default function ContestantCard({ contestant, votingOpen, rank }: ContestantCardProps) {
  return (
    <div className="frame-card group overflow-hidden">
      {typeof rank === "number" && (
        <div className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/50 bg-ink-950/80 font-display text-sm text-gold-200 shadow-lg">
          {rank}
        </div>
      )}

      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[1.75rem]">
        <Image
          src={contestant.photoUrl}
          alt={contestant.name}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
      </div>

      <div className="flex flex-col gap-3 px-6 pb-6 pt-4">
        <div>
          <h3 className="font-display text-xl text-ink-50 sm:text-2xl">{contestant.name}</h3>
          {contestant.msaChapter && (
            <p className="mt-0.5 font-body text-xs uppercase tracking-[0.15em] text-gold-300/80">
              {contestant.msaChapter}
            </p>
          )}
        </div>
        <p className="line-clamp-3 font-body text-sm leading-relaxed text-ink-300">{contestant.bio}</p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg text-gold-200 sm:text-xl">
              {contestant.voteCount.toLocaleString("en-NG")}
            </p>
            <p className="font-body text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">votes</p>
          </div>

          {votingOpen ? (
            <Link href={`/vote/${contestant.id}`} className="btn-gold">
              Vote
            </Link>
          ) : (
            <button type="button" disabled className="btn-outline-gold" aria-disabled>
              Vote
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
