import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold-400/10 bg-ink-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span className="h-2 w-2 rotate-45 bg-gold-400 transition-transform duration-300 group-hover:rotate-[225deg]" />
          <span className="font-display text-lg tracking-wide text-ink-50 sm:text-xl">{SITE_NAME}</span>
        </Link>
        <div className="flex items-center gap-5 font-body text-xs uppercase tracking-[0.2em] text-ink-200 sm:gap-8 sm:text-sm">
          <Link href="/" className="transition-colors hover:text-gold-300">
            Home
          </Link>
          <Link href="/results" className="transition-colors hover:text-gold-300">
            Leaderboard
          </Link>
        </div>
      </nav>
    </header>
  );
}
