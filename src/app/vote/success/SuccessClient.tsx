"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PAYMENT_STATUS_POLL_INTERVAL_MS } from "@/lib/config";
import GoldDivider from "@/components/GoldDivider";

/** After this long still "pending", reassure the voter instead of just spinning forever. */
const LONG_WAIT_MS = 25000;

interface VerifyResponse {
  status: "pending" | "success" | "failed";
  votesCredited: number;
  contestantName: string | null;
}

export default function SuccessClient({ reference }: { reference: string | null }) {
  const { data, error } = useSWR<VerifyResponse>(
    reference ? `/api/paystack/verify?reference=${encodeURIComponent(reference)}` : null,
    fetcher,
    {
      refreshInterval: (latest) => (latest && latest.status !== "pending" ? 0 : PAYMENT_STATUS_POLL_INTERVAL_MS),
    }
  );

  const [longWait, setLongWait] = useState(false);
  useEffect(() => {
    if (!reference) return;
    const timer = setTimeout(() => setLongWait(true), LONG_WAIT_MS);
    return () => clearTimeout(timer);
  }, [reference]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      <div className="frame-card w-full px-8 py-12">
        {!reference && (
          <>
            <p className="font-display text-2xl text-ink-50">No payment reference found</p>
            <p className="mt-3 font-body text-sm text-ink-300">
              If you were just redirected from checkout, try refreshing. Otherwise, head back and cast your vote.
            </p>
          </>
        )}

        {reference && error && (
          <>
            <p className="font-display text-2xl text-burgundy-200">We couldn&apos;t find that transaction</p>
            <p className="mt-3 font-body text-sm text-ink-300">
              Reference <span className="text-ink-100">{reference}</span> wasn&apos;t recognized. If money left your
              account, contact us with this reference and it will be reconciled manually.
            </p>
          </>
        )}

        {reference && !error && (!data || data.status === "pending") && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gold-400/30 border-t-gold-400" />
            <p className="font-display text-2xl text-ink-50">Confirming your payment&hellip;</p>
            <p className="mt-3 font-body text-sm text-ink-300">
              This usually takes a few seconds while Paystack confirms the charge. Please don&apos;t close this page.
            </p>
            {longWait && (
              <p className="mt-4 font-body text-xs text-ink-400">
                Still going? If you completed the payment, this can occasionally take a minute — hang tight. If it&apos;s
                been a while, contact us with reference <span className="text-ink-200">{reference}</span> and we&apos;ll
                confirm it manually.
              </p>
            )}
          </>
        )}

        {data?.status === "success" && (
          <>
            <p className="font-display text-3xl text-gold-200">Vote confirmed 🎉</p>
            <GoldDivider className="my-5" />
            <p className="font-body text-base text-ink-200">
              {data.votesCredited} vote{data.votesCredited === 1 ? "" : "s"} credited to{" "}
              <span className="text-gold-200">{data.contestantName}</span>.
            </p>
            <p className="mt-2 font-body text-sm text-ink-400">Thank you for your support!</p>
          </>
        )}

        {data?.status === "failed" && (
          <>
            <p className="font-display text-2xl text-burgundy-200">Payment not successful</p>
            <p className="mt-3 font-body text-sm text-ink-300">
              Your payment could not be confirmed, so no votes were credited. No charge should have been made — if
              you were charged, please contact us with reference <span className="text-ink-100">{reference}</span>.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn-gold">
            Back to Nominees
          </Link>
          <Link href="/results" className="btn-outline-gold">
            View Leaderboard
          </Link>
        </div>
      </div>
    </section>
  );
}
