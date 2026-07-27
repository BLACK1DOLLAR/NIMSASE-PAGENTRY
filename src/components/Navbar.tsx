import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold-400/10 bg-ink-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-8 sm:py-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rotate-45 bg-gold-400 transition-transform duration-300 group-hover:rotate-[225deg]" />
          {/* Short mark on phones so it never fights the nav pills for space; full name from sm: up. */}
          <span className="font-display text-base tracking-wide text-ink-50 sm:hidden">
            {SITE_NAME.split(" ")[0]}
          </span>
          <span className="hidden font-display text-lg tracking-wide text-ink-50 sm:inline sm:text-xl">
            {SITE_NAME}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2 font-body text-[11px] uppercase tracking-[0.15em] text-ink-200 sm:gap-4 sm:text-sm">
          <Link
            href="/"
            className="rounded-full border border-gold-400/30 px-3 py-1.5 transition-all duration-300 hover:border-gold-300 hover:bg-gold-400/10 hover:text-gold-200 sm:px-4 sm:py-2"
          >
            Home
          </Link>
          <Link
            href="/results"
            className="rounded-full border border-gold-400/30 px-3 py-1.5 transition-all duration-300 hover:border-gold-300 hover:bg-gold-400/10 hover:text-gold-200 sm:px-4 sm:py-2"
          >
            Leaderboard
          </Link>
        </div>
      </nav>
    </header>
  );
}
