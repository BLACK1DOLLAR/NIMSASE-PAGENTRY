import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set. Add it to .env.local and your Vercel project's environment variables."
    );
  }
  return key;
}

export interface InitializeTransactionInput {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Creates a Paystack transaction and returns the hosted checkout URL. This
 * only ever runs server-side (never expose the secret key to the client).
 */
export async function initializePaystackTransaction(
  input: InitializeTransactionInput
): Promise<InitializeTransactionResult> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? {},
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || !data?.status) {
    throw new Error(data?.message || "Paystack failed to initialize the transaction.");
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

export interface VerifyTransactionResult {
  status: "success" | "failed" | "abandoned" | string;
  reference: string;
  amount: number; // kobo
  currency: string;
  paidAt: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Server-to-server verification against Paystack. The webhook handler MUST
 * call this before crediting any votes — never trust the webhook payload
 * (or the client redirect) on its own, since both can in principle be forged
 * without a valid signature check, and this closes that gap with a second,
 * independent confirmation straight from Paystack's API.
 */
export async function verifyPaystackTransaction(reference: string): Promise<VerifyTransactionResult> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
    },
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || !data?.status) {
    throw new Error(data?.message || "Paystack failed to verify the transaction.");
  }

  return {
    status: data.data.status,
    reference: data.data.reference,
    amount: data.data.amount,
    currency: data.data.currency,
    paidAt: data.data.paid_at ?? null,
    metadata: data.data.metadata ?? null,
  };
}

/**
 * Validates the `x-paystack-signature` header against an HMAC-SHA512 of the
 * *raw* request body, as documented at
 * https://paystack.com/docs/payments/webhooks/#verifying-webhook-source
 * Must be called with the untouched raw body string/buffer, before any
 * JSON.parse — parsing and re-stringifying can change byte-for-byte content
 * (key order, whitespace) and silently break the signature check.
 */
export function isValidPaystackSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const expected = crypto.createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signatureHeader, "hex");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
