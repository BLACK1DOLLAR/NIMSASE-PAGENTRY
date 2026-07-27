import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { isValidPaystackSignature } from "@/lib/paystack";
import { verifyAndCreditTransaction } from "@/lib/creditTransaction";

export const dynamic = "force-dynamic";

/**
 * The primary path for crediting votes — Paystack calls this the moment a
 * charge succeeds. (/api/paystack/verify has a fallback that does the same
 * verify-and-credit for cases where this webhook never arrives, e.g. a
 * misconfigured or unreachable webhook URL — see verifyAndCreditTransaction.)
 *
 * Two independent safeguards before a single vote is credited:
 *
 *  1. Signature check — the raw body must be HMAC-SHA512 signed with our
 *     Paystack secret key, proving the call actually came from Paystack.
 *  2. Server-to-server re-verification — verifyAndCreditTransaction calls
 *     Paystack's own /verify endpoint rather than trusting this webhook
 *     payload's `status`/`amount` fields, in case those were tampered with
 *     in transit.
 *
 * Idempotency is enforced at the database layer inside
 * verifyAndCreditTransaction: a transaction only ever flips from non-
 * "success" to "success" once, so concurrent webhook retries and/or
 * concurrent polling from /vote/success can't double-credit.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!isValidPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const reference = event.data?.reference;
  if (!reference) {
    // Nothing actionable — acknowledge so Paystack doesn't keep retrying.
    return NextResponse.json({ received: true });
  }

  await connectToDatabase();

  try {
    if (event.event === "charge.success") {
      await verifyAndCreditTransaction(reference);
    } else if (event.event === "charge.failed") {
      await Transaction.findOneAndUpdate(
        { reference, status: "pending" },
        { status: "failed" }
      );
    }
    // Other event types (e.g. transfer events) are intentionally ignored.
  } catch (err) {
    console.error("Paystack webhook processing error:", err);
    // Still 200 the request: Paystack will retry on non-2xx, and retrying a
    // Paystack-side API error (e.g. verify endpoint hiccup) indefinitely
    // isn't useful. The transaction stays "pending" for manual reconciliation.
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
