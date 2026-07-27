# NIMSA South East Pageantry Voting

A full-stack, mobile-first voting platform: 6 contestants, ₦-to-vote checkout via **Paystack**, real-time vote counts, and a countdown-gated voting window. Built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **MongoDB Atlas**, ready to deploy on **Vercel**.

## Design decisions (and why)

The build prompt left two things open-ended; here's what this implementation picked:

- **Database: MongoDB Atlas** (via Mongoose), not Vercel Postgres. Contestant/transaction documents map naturally onto a document store, and Atlas's free tier is enough to run this.
- **Real-time updates: polling, not Pusher/Ably.** The homepage and leaderboard poll `/api/contestants` every 7 seconds via SWR (`src/lib/config.ts` → `CONTESTANTS_POLL_INTERVAL_MS`). This avoids a third-party real-time account before you've even shipped v1. If you outgrow polling later, swap the `useSWR` calls in `ContestantGrid.tsx` / `ResultsClient.tsx` for a Pusher/Ably subscription — the rest of the app doesn't need to change.

## How votes actually get credited (read this before going live)

**The client is never trusted for vote counts.** The only code path that increments `voteCount` is `handleChargeSuccess()` inside [`src/app/api/paystack/webhook/route.ts`](src/app/api/paystack/webhook/route.ts), and it does three things in order:

1. Verifies the `x-paystack-signature` header is a valid HMAC-SHA512 of the raw request body, signed with your `PAYSTACK_SECRET_KEY`. Requests that fail this are rejected with 401 before anything else runs.
2. Re-verifies the transaction **server-to-server** by calling Paystack's own `GET /transaction/verify/:reference` — it does not trust the `status`/`amount` fields inside the webhook payload itself.
3. Uses an atomic `findOneAndUpdate({ reference, status: { $ne: "success" } }, { status: "success" })` to flip the transaction, so if Paystack retries the same webhook (which it does aggressively), only the first delivery can ever credit votes. The amount paid is also checked against the amount recorded when checkout was initiated before crediting.

The `/vote/success` page and `/api/paystack/verify` endpoint are purely read-only — they poll the DB to show the voter a "confirmed" state, but never credit anything themselves.

## Project structure

```
src/
  app/
    page.tsx                        Homepage: hero, countdown, contestant grid
    vote/[contestantId]/page.tsx    Vote quantity selector -> Paystack checkout
    vote/success/page.tsx           Post-checkout status (polls for webhook confirmation)
    results/page.tsx                Live leaderboard
    admin/page.tsx                  Password-protected dashboard
    api/
      contestants/route.ts          GET public contestant list (polled)
      settings/route.ts             GET public voting window
      paystack/initialize/route.ts  POST creates a pending transaction + Paystack checkout
      paystack/webhook/route.ts     POST verifies + credits votes (see above)
      paystack/verify/route.ts      GET read-only status lookup for the success page
      admin/...                     Login/logout, contestant CRUD, settings, CSV export
  components/                       Navbar, Footer, CountdownTimer, ContestantCard/Grid, Reveal, GoldDivider
  lib/                              config, db, models, paystack helpers, adminAuth, votingPhase
  types/                            Shared DTO types
scripts/seed.ts                     Seeds 6 placeholder contestants + a default voting window
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a MongoDB Atlas cluster

Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), add a database user, allow network access (or `0.0.0.0/0` for quick testing), and copy the connection string.

### 3. Get Paystack test keys

Sign up at [paystack.com](https://paystack.com), then grab your **test** keys from **Settings → API Keys & Webhooks**: [dashboard.paystack.com/#/settings/developers](https://dashboard.paystack.com/#/settings/developers). Test mode lets you run the full flow with Paystack's test cards — no real money involved.

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Description |
|---|---|
| `MONGODB_URI` | Atlas connection string, including the database name |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` (server-only, never exposed to the client) |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_...` (reserved for future client-side use; not currently required since checkout redirects to Paystack's hosted page) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; your production URL once deployed |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `ADMIN_SESSION_SECRET` | Any long random string, used to sign the admin session cookie |
| `VOTING_STARTS_AT` / `VOTING_ENDS_AT` | Only used the *first* time `getSettings()` or the seed script runs, to create the initial voting window. Edit the window from `/admin` after that — it's stored in the DB, not re-read from env vars. |

### 5. Seed placeholder contestants

```bash
npm run seed
```

This inserts 6 placeholder contestants (with placeholder photos from picsum.photos) and a default voting window, only if the collection is empty. **Replace the placeholder names/bios/photos** with your real contestants — either edit `scripts/seed.ts` before running it, or manage them afterward from `/admin`.

Contestant photos added via the "Upload Photo" button in `/admin` are stored directly in MongoDB (GridFS) — no extra service or env var needed, it just works as soon as `MONGODB_URI` is set. Pasting a Photo URL directly still works too.

### 6. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

### 7. Point Paystack's webhook at your app

Paystack needs to reach `/api/paystack/webhook` to actually credit votes — the redirect back to `/vote/success` alone does **not** credit anything. Locally, use a tunnel (e.g. `npx localtunnel --port 3000` or `ngrok http 3000`) and set the webhook URL in the Paystack dashboard to `https://<your-tunnel>/api/paystack/webhook`. In production, use `https://<your-domain>/api/paystack/webhook`.

## Deploying to Vercel

1. Push this project to a Git repository and import it in [vercel.com/new](https://vercel.com/new).
2. In **Project Settings → Environment Variables**, add every variable from `.env.local` (use your **live** Paystack keys only when you're ready to accept real payments — keep using test keys for a staging deployment).
3. Set `NEXT_PUBLIC_SITE_URL` to your Vercel domain (e.g. `https://your-project.vercel.app`).
4. Deploy.
5. In the Paystack dashboard, set the webhook URL to `https://your-project.vercel.app/api/paystack/webhook`.
6. Visit `/admin`, sign in, and set the real voting window / add your real contestants (or run `npm run seed` against production `MONGODB_URI` beforehand).

## Changing the vote price

`₦100 = 1 vote` lives in exactly one place: `NAIRA_PER_VOTE` in [`src/lib/config.ts`](src/lib/config.ts). Every amount calculation (`nairaFromVotes`, `koboFromVotes`, `formatNaira`) derives from it — change the constant and the whole app (checkout amount, vote page preview, admin revenue estimates) updates together.

## Security notes for going live

- Rotate `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` before launch; don't reuse the placeholder values.
- The admin session cookie is `httpOnly`, `sameSite=lax`, and marked `secure` automatically in production (`NODE_ENV=production` on Vercel).
- `next.config.mjs` currently allows images from any HTTPS host (`remotePatterns: [{ hostname: "**" }]`) so admins can paste any photo URL. Consider restricting this to your actual image host (Cloudinary, S3, etc.) once you know it.
- Transaction amounts are validated against Paystack's verified amount before any votes are credited — a tampered checkout amount cannot result in cheap votes.
# NIMSASE-PAGENTRY
