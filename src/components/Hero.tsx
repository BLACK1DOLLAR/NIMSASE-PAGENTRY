import CountdownTimer from "@/components/CountdownTimer";
import GoldDivider from "@/components/GoldDivider";
import { SITE_NAME, SITE_TAGLINE, NAIRA_PER_VOTE } from "@/lib/config";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-20 text-center sm:pb-24 sm:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-radial-glow" />

      <p className="eyebrow animate-fade-up">Cast your vote &middot; ₦{NAIRA_PER_VOTE} = 1 vote</p>

      <h1 className="mx-auto mt-5 max-w-3xl text-balance font-display text-4xl leading-tight text-ink-50 animate-fade-up sm:text-6xl">
        {SITE_NAME}
      </h1>

      <GoldDivider className="my-6" />

      <p
        className="mx-auto max-w-xl text-balance font-body text-base text-ink-300 animate-fade-up sm:text-lg"
        style={{ animationDelay: "120ms" }}
      >
        {SITE_TAGLINE}
      </p>

      <div className="mt-12 flex justify-center animate-fade-up" style={{ animationDelay: "220ms" }}>
        <CountdownTimer />
      </div>
    </section>
  );
}
