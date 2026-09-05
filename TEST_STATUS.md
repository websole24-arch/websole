Build              PASS  (client `npm run build` — 160 modules; server
                    `npm test` — see Detail)
Lint               NOT CONFIGURED
Unit Tests         PASS  (42/42 — Supabase JWT verification + mocked auth
                    controller logic (register/login/verify/resend) +
                    protect middleware's network fallback for tokens
                    that fail local verification + the review
                    completed-project eligibility gate + mocked-Stripe
                    payment controller (checkout ownership/amount/
                    idempotency, webhook signature + idempotent apply) +
                    mocked-Supabase-Storage file controller (upload
                    ownership/MIME allowlist/category validation,
                    signed-url download, admin-only delete) — Session 14;
                    bcrypt/custom-JWT unit tests removed, those modules
                    no longer exist)
Integration Tests  PASS  (health check, auth validation-only, projects
                    auth-gate, admin-routes auth-gate — see Detail)
API Tests          PASS  (Projects API + Payment gate, both verified
                    against a real local Postgres — see Detail; Supabase
                    Auth and Stripe themselves NOT verified live, no
                    network access to *.supabase.co or api.stripe.com in
                    this sandbox — see Detail)
Authentication     PASS — the live-Supabase gap this used to flag is
                    closed. Server logs from an actual run against a
                    real Supabase project showed login succeeding (200)
                    but every following request 401ing "Not
                    authenticated" and wiping cookies — that project
                    signs tokens asymmetrically, so local HS256
                    verification failed unconditionally. Fixed:
                    protect/attachUserIfPresent now fall back to a real
                    supabase.auth.getUser() check before clearing a
                    session on a non-expiry verification failure (see
                    DECISIONS.md, tests/unit/authMiddleware.test.js).
                    register/login/verify's own SDK calls are still
                    mocked, not live — see Detail.
Authorization      PASS  (role checks verified against a real local
                    Postgres for Projects; the new admin-only routes —
                    services/packages/pricing "admin/all" + /api/users —
                    only have the no-session 401 case automated so far,
                    see BUGS in TODO.md)
Projects API       PASS  (create with correct 50/50 split, owner GET, IDOR 403,
                    non-admin PATCH 403, admin PATCH 200 + ActivityLog row —
                    all verified against a real local Postgres, using
                    locally-minted Supabase-shaped tokens — see Detail)
Admin Dashboard    NOT TESTED — new this session (Overview/Projects/
                    Customers/Services/Packages/Pricing/Inquiries tabs).
                    Client build passes and it renders against the API's
                    documented response shapes, but has not been
                    exercised against a live backend + real data (no DB
                    in this sandbox — see BUGS in TODO.md)
File Upload        PASS (mocked) — upload/list/download/delete controller
                    logic unit-tested against a mocked Supabase Storage
                    SDK (ownership, category + MIME allowlist, signed-url
                    generation, download-count increment, admin-only
                    delete). NOT verified against a real Storage bucket —
                    see DEPLOYMENT.md's live-verification checklist.
Payment            PASS (mocked) + PASS (live DB) — Checkout Session
                    creation, webhook signature verification, and
                    idempotent "mark paid" logic unit-tested against a
                    mocked Stripe SDK
                    (tests/unit/paymentController.test.js, 8/8); the
                    "Project Started" payment gate itself IS verified
                    against a real local Postgres
                    (tests/integration/payments-db.test.js, 4/4 —
                    blocks with no Paid advance row, allows once one
                    exists, advancePaid reflects correctly on the
                    Project response). Stripe itself NOT called live —
                    no network access to api.stripe.com in this sandbox.
UI Tests           NOT TESTED — no frontend test suite configured yet
Security Tests     NOT TESTED — no live environment to test against

## Detail

Backend: `cd server && npm test` — 7 suites, 33 tests passing, 1 suite
(5 tests) self-skipped (needs RUN_DB_TESTS=1 + a real Postgres). The auth
unit suite (tests/unit/authController.test.js, 16 tests) now also covers
the email-verification flow added this session: register creates an
unconfirmed Supabase user and triggers resend() rather than signing in;
login maps Supabase's `email_not_confirmed` to a distinct 403; the new
POST /auth/verify endpoint accepts/rejects tokens correctly and only
updates the profile's emailVerified once; POST /auth/resend-verification
always answers 200. Getting this suite (and every other auth/admin
integration test) passing required one infra fix: authLimiter/apiLimiter
now skip under NODE_ENV=test (server/src/middleware/rateLimiter.js) —
supertest firing >10 requests at shared /auth/* routes within one test
run was tripping the real 10-per-15-min production limiter, the same
category of issue morgan already special-cased for tests in app.js.
Frontend: `cd client && npm run build` — compiles cleanly, 154 modules
(was 137 before this session's verification-flow additions: new
VerifyCallback.jsx page/route, plus changes to Register/Login/AdminLogin/
AuthContext — no new dependencies, just first-party files).

npm audit: server — 0 vulnerabilities (bcryptjs dropped, no new
findings from @supabase/supabase-js). client — 0 vulnerabilities.

### What Session 4 (Supabase Auth) verified live vs. mocked

This sandbox has no network access to `*.supabase.co` (not in the
allowed egress list), so the actual Supabase Auth API calls — user
creation, password sign-in, session refresh, revocation — could not be
exercised against a real Supabase project this session. What was
actually done instead:

- **Locally testable (and tested):** everything downstream of "we
  already have a valid Supabase-issued access token" — the `protect`
  middleware's local JWT verification (server/tests/unit/
  supabaseJwt.test.js: valid token, wrong secret, expired token,
  missing secret config) and the entire Projects flow running under
  that middleware, against a real local Postgres
  (server/tests/integration/projects-db.test.js) — 5/5 passing,
  identical coverage to what Session 3 verified for the Projects API,
  now proven to still hold with Supabase-shaped tokens instead of the
  old custom ones. This suite mints its own HS256 tokens matching
  Supabase's claim shape (`sub`, `email`, `role: authenticated`) and
  inserts profile rows directly, bypassing the register/login HTTP
  endpoints (which need real network) while still fully exercising
  `protect` -> ownership check -> Projects controller -> Postgres.
- **Mocked (not live):** `POST /api/auth/register` and `POST
  /api/auth/login`'s actual Supabase SDK calls
  (server/tests/unit/authController.test.js) — 8 tests covering the
  happy path, duplicate email, profile-insert-failure rollback, and
  two error-status-mapping cases (a real Supabase Auth error passes
  through with its status; an unreachable-Supabase failure maps to 502
  instead of a raw "fetch failed" 400 — a real bug this caught, see
  DECISIONS.md). These confirm the controller *calls the SDK
  correctly and handles its responses correctly*, not that Supabase
  itself behaves as assumed.
- **Manually spot-checked, not automated:** booted the server with a
  syntactically-valid but unreachable SUPABASE_URL and hit POST
  /api/auth/register — confirmed it fails gracefully (502, clean
  message) rather than crashing the process. This is what surfaced the
  502-vs-400 bug above.

Also re-verified this session: `npm run seed`'s non-auth logic
(services/packages/country_pricing) still works unchanged against a
real local Postgres (5 services, 15 packages, 45 pricing rows) — the
admin-user-creation part of seed.js needs real Supabase credentials and
was not exercised (correctly no-ops without SEED_ADMIN_EMAIL/PASSWORD
set, confirmed).

### Before trusting this in production

1. Point SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_JWT_SECRET
   at the real project and manually run through register -> login ->
   logout -> a token-expiry-triggered refresh, confirming cookies and
   `/api/auth/me` behave as this session's mocks assume.
2. Confirm your Supabase project actually exposes the legacy JWT secret
   used by SUPABASE_JWT_SECRET — some newer projects sign with an
   asymmetric key instead, which this approach doesn't support as-is
   (see server/src/utils/supabaseJwt.js and TODO.md).
3. Re-run `npm run db:migrate` + `npm run seed` +
   `RUN_DB_TESTS=1 npx jest tests/integration/projects-db.test.js`
   against the actual Supabase Postgres instance (done against local
   Postgres this session and the session before, not yet against
   Supabase itself).

### Session 14 (Stripe payments + Supabase Storage file uploads + deploy config)

This sandbox's egress allowlist covers npm/GitHub registries only — no
`*.supabase.co`, no `api.stripe.com`. Confirmed directly this session:
`curl https://<project-ref>.supabase.co/auth/v1/health` returns 403
`host_not_allowed` from the egress proxy itself, not a Supabase error.
So, same constraint as every previous session, now also applying to
Stripe: the SDK-call *logic* is tested (mocked), the actual third-party
APIs are not.

**What got a local Postgres installed and used for real this session**
(previous sessions' DB-backed tests ran against local Postgres too, but
it's worth being explicit): `apt-get install postgresql`, started via
`service postgresql start`, a `testdb` database created, schema applied.
`tests/integration/projects-db.test.js` (pre-existing, 5 tests) and the
new `tests/integration/payments-db.test.js` (4 tests) both ran and
passed against it — real INSERT/UPDATE/SELECT, real trigger-maintained
`updated_at`, real foreign keys, real check constraints. This is a
genuine Postgres, just not Supabase's managed instance specifically (no
`auth.users` fixture needed — `payments-db.test.js` reuses the
`projects-db.test.js` fixture pattern, standing in a bare `auth.users`
table the same way).

**Mocked this session** (`jest.mock('../../src/lib/stripe')` /
`jest.mock('../../src/lib/supabase')`, same pattern as
`authController.test.js`):
- `tests/unit/paymentController.test.js` (8 tests) — Checkout Session
  creation (ownership/IDOR check, amount-in-minor-units math, blocks
  double-pay, blocks final-before-advance), webhook handling (applies on
  `checkout.session.completed`, idempotent on retry, 400s a bad
  signature rather than 500ing)
- `tests/unit/fileController.test.js` (8 tests) — upload (ownership,
  MIME allowlist rejects before touching Storage, category validation),
  download (signed-URL generation, download-count increment, 404s a
  file id that doesn't belong to the project in the URL — an IDOR check
  on the file itself, not just the project), delete (admin-only)

**Not exercised at all, mocked or otherwise:** multer's actual multipart
parsing against a real large/malformed upload (tests use small in-memory
buffers); Supabase Storage's actual bucket-not-found or
quota-exceeded error shapes; Stripe's actual error shapes for a declined
card, a currency Stripe doesn't support, or a webhook replay outside the
signature's tolerance window.

**Client**: `npm install` (159 packages) + `npm run build` — 160 modules
(was 154), clean. New this session: `ProjectFiles.jsx` (shared upload/
download widget), Dashboard.jsx's Stripe-return handling
(`?payment=success&session_id=...`), ProjectsTab.jsx's advance-paid Pill
+ file manager. Not run in a browser — build passing is not the same as
UI-tested, see PROJECT_STATUS.md.

**Deploy config** (`client/vercel.json`, `server/railway.toml`,
`server/render.yaml`, both `.env.production.example` files,
`DEPLOYMENT.md`): written, not deployed. Nothing to verify locally here
short of actually standing up a Vercel + Railway project — see
DEPLOYMENT.md's live-verification checklist for what to run once you do.

### Before trusting the Session 14 work in production

1. Run DEPLOYMENT.md's "Live verification checklist" end to end against
   real Supabase + real Stripe test-mode keys — register, pay a test
   Checkout session, confirm the webhook actually lands (not just the
   `/verify` fallback), upload/download a real file.
2. Only then switch `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` to live
   keys.
3. The file-type allowlist in `fileController.js` checks the
   browser-declared `Content-Type`, not the file's actual bytes — fine
   for authenticated project owners/admins uploading their own project
   files, but worth tightening (a real MIME-sniffing lib, or AV
   scanning) if this ever accepts uploads from a less-trusted source.
