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
    <div className="frame-card group flex h-full flex-col overflow-hidden">
      {typeof rank === "number" && (
        <div className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/50 bg-ink-950/80 font-display text-xs text-gold-200 shadow-lg">
          {rank}
        </div>
      )}

      <div className="relative aspect-[3/4] overflow-hidden rounded-t-[1.75rem]">
        <Image
          src={contestant.photoUrl}
          alt={contestant.name}
          fill
          sizes="(min-width: 1280px) 220px, (min-width: 1024px) 260px, (min-width: 640px) 30vw, 45vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
        <div>
          <h3 className="font-display text-base leading-tight text-ink-50 sm:text-lg">{contestant.name}</h3>
          {contestant.msaChapter && (
            <p className="mt-0.5 font-body text-[0.6rem] uppercase tracking-[0.15em] text-gold-300/80 sm:text-xs">
              {contestant.msaChapter}
            </p>
          )}
        </div>
        {/* Hidden on phones: with two cards per row the bio is unreadable at
            that width and only adds scrolling to a 19-contestant grid. */}
        <p className="hidden font-body text-xs leading-relaxed text-ink-300 sm:line-clamp-2 sm:block">
          {contestant.bio}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div>
            <p className="font-display text-base leading-none text-gold-200 sm:text-lg">
              {contestant.voteCount.toLocaleString("en-NG")}
            </p>
            <p className="mt-0.5 font-body text-[0.6rem] uppercase tracking-[0.2em] text-ink-400">votes</p>
          </div>

          {votingOpen ? (
            <Link href={`/vote/${contestant.id}`} className="btn-gold px-4 py-2 text-xs">
              Vote
            </Link>
          ) : (
            <button type="button" disabled className="btn-outline-gold px-4 py-2 text-xs" aria-disabled>
              Vote
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
