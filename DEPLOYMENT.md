# Deployment

Target shape: client on Vercel, API on Railway (or Render — both configs
included), database/auth/storage on Supabase, payments on Stripe.

## Before you deploy: what's untested here and why

This build was done in a sandbox with no network access to `*.supabase.co`
or `api.stripe.com` — only npm/GitHub registries are reachable. Everything
below was verified as far as it could be without that access:

- **Server test suite**: 65/65 passing, including a real (locally
  installed) Postgres — `cd server && RUN_DB_TESTS=1 DATABASE_URL=<local>
  npm test`. Stripe/Supabase SDK calls are mocked in these tests, not live.
- **Client build**: `cd client && npm run build` — 160 modules, clean.
- **Never run**: `npm run db:migrate` / `npm run seed` against your actual
  Supabase project, a real Stripe Checkout session end-to-end, a real file
  upload to Supabase Storage, or login/register against live Supabase Auth.

None of that is a reason to distrust the code — it's the same shape as
every other Supabase/Stripe call already in this app (see
`TEST_STATUS.md` for how the Session 4 Auth migration handled the same
constraint) — but budget time for the "Live verification" checklist at
the bottom before you consider this done.

## 1. Supabase project setup

You already have `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_JWT_SECRET` in `server/.env` from earlier setup. Two things are
new this session:

1. **Storage bucket** — Supabase dashboard -> Storage -> New bucket ->
   name it `project-files` (or set `SUPABASE_STORAGE_BUCKET` to whatever
   you name it) -> **Private** (not public — downloads go through
   short-lived signed URLs, see `server/src/controllers/fileController.js`).
2. **Run the schema + seed against the real project**, not just local
   Postgres:
   ```
   cd server
   npm run db:migrate
   npm run seed          # only if you want sample services/packages/pricing
   ```

## 2. Stripe setup

1. Dashboard -> Developers -> API keys -> copy the **secret key**
   (`sk_test_...` for now, `sk_live_...` once you're ready for real
   charges) into `STRIPE_SECRET_KEY`.
2. Deploy the server first (step 4 below) so you have a real URL, then:
   Dashboard -> Developers -> Webhooks -> Add endpoint ->
   `https://your-api.up.railway.app/api/payments/webhook` -> select
   `checkout.session.completed`, `checkout.session.expired`,
   `checkout.session.async_payment_failed` -> copy the **signing secret**
   into `STRIPE_WEBHOOK_SECRET`.
3. For local/pre-deploy testing, `stripe listen --forward-to
   localhost:5000/api/payments/webhook` (Stripe CLI) gives you a
   throwaway webhook secret for local dev — the app also has a
   `/api/payments/verify/:sessionId` fallback (see
   `paymentController.js`) that syncs payment status on redirect-back
   even if no webhook ever fires, specifically so local dev doesn't
   require running the CLI.

No client-side Stripe key is needed — checkout uses Stripe's own hosted
page (Checkout Session redirect), not Stripe Elements, so the client
never touches card data or a publishable key.

## 3. Deploy the client — Vercel

1. New Project -> import this repo -> **Root Directory: `client`** (this
   matters — it's a monorepo, Vercel won't find `package.json` at the
   repo root).
2. Framework preset: Vite (auto-detected). Build command / output
   directory are already set in `client/vercel.json`.
3. Environment variables: copy from `client/.env.production.example`,
   filling in real values — set `VITE_API_URL` once you know your
   Railway URL (step 4), or come back and update it after.
4. Deploy. Note the resulting URL (`https://yourapp.vercel.app` or your
   custom domain) — the server needs it next.

## 4. Deploy the server — Railway

1. New Project -> Deploy from GitHub repo -> **Root Directory: `server`**.
2. Railway reads `server/railway.toml` automatically (build/start
   commands, health check at `/api/health`).
3. Environment variables: copy from `server/.env.production.example`,
   filling in real values. **`CLIENT_ORIGIN` must be your actual Vercel
   URL from step 3** — this is both the CORS allow-list and where
   Supabase sends email-confirmation redirect links.
4. Deploy. Note the resulting URL (`https://your-api.up.railway.app`) —
   go back to Vercel and set `VITE_API_URL` to `<that URL>/api`, redeploy
   the client (env var changes need a redeploy, not just a restart).
5. Go back to Stripe (step 2) and register the webhook now that you have
   a real API URL.

**Using Render instead?** `server/render.yaml` is the equivalent config —
same Root Directory / env var caveats apply.

## 5. The cross-domain cookie fix (already done, worth knowing about)

Vercel and Railway are different top-level domains, so the browser treats
API calls as cross-site. Session cookies (`sb_access_token`,
`sb_refresh_token`) need `SameSite=None; Secure` for the browser to send
them on those cross-site requests at all — `SameSite=Lax` (the dev
default) would silently break every request after login. This is handled
automatically: `server/src/utils/sessionCookies.js` switches to
`SameSite=None` once `NODE_ENV=production`. Just make sure
`NODE_ENV=production` is actually set in Railway/Render — nothing else
needs to change.

## 6. Live verification checklist (do this after deploying)

Run through these once against the real, deployed stack — this is what
this sandbox couldn't do for you:

- [ ] Register a new account, confirm the verification email arrives and
      the link logs you in (`/auth/callback`)
- [ ] Log in, confirm the session survives a page refresh (cookie is
      actually being sent cross-site — see #5)
- [ ] Create a project from Pricing, confirm the 50/50 split is correct
- [ ] Click "Pay 50% Advance", complete a Stripe test-mode card
      (`4242 4242 4242 4242`, any future date/CVC), confirm you land back
      on the dashboard with "Payment confirmed" and the project shows
      "Advance paid"
- [ ] Check Stripe Dashboard -> Webhooks -> your endpoint -> confirm the
      `checkout.session.completed` event shows a 200 response (not just
      the `/verify` fallback covering for it)
- [ ] As admin, confirm you *can't* move the project to "Project Started"
      before the above, and *can* immediately after
- [ ] Upload a file as the customer (Dashboard -> Files), confirm it
      appears for admin too, and downloads correctly (signed URL)
- [ ] Switch Stripe to live keys only once all of the above is confirmed
      in test mode
