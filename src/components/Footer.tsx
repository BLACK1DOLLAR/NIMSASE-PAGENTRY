import GoldDivider from "@/components/GoldDivider";
import { SITE_NAME } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-gold-400/10 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center sm:px-8">
        <GoldDivider />
        <p className="font-display text-base text-ink-100">{SITE_NAME}</p>
        <p className="max-w-md font-body text-xs text-ink-400">
          Votes are secured and verified server-side through Paystack. Every ₦ paid is credited only after payment
          confirmation — never on trust.
        </p>
      </div>
    </footer>
  );
}
