# Architecture

## Frontend
React 18 + Vite + Tailwind CSS. Client-side routing via react-router-dom.
Two contexts: AuthContext (session state via /api/auth/me) and
CountryContext (selected country, persisted to localStorage).

Known limitation: this is CSR-only. Crawlers that don't execute JS will
see a mostly-empty shell. If full SEO matters before launch, consider
migrating to a SSR/prerender approach (Next.js, or a prerender service)
for the public marketing pages.

### Design system (refreshed Session 5)
Tokens live in client/tailwind.config.js: `ink`/`paper` (near-black /
off-white base), `signal` (cobalt blue — the one primary interactive
accent: CTAs, links, focus states), `coral` (secondary accent, used
sparingly), `jade`/`brass` (kept, now used only for state colour — e.g.
an "active"/"disabled" pill in the admin dashboard — not as a
page-level brand accent anymore). Fonts: Space Grotesk (display,
headlines only), Inter (body), IBM Plex Mono (currency figures, status
codes, labels). Home page (client/src/pages/Home.jsx) and the shared
Navbar/Footer were rebuilt on these tokens; most inner pages
(Login/Register/Contact/ServiceDetail/etc.) got their primary-accent
classes swapped from the old `jade` green to `signal` blue for
consistency but weren't otherwise redesigned — see TODO.md.
No icon library was added; client/src/components/common/{ServiceIcon,
Icon}.jsx are small hand-rolled SVG sets instead, to avoid a new
dependency for a handful of icons.

### Motion (Session 6)
No animation library was added either (same reasoning as the icons —
small need, kept dependency-free). Two small hooks in client/src/hooks/
cover it: `useScrollReveal` (IntersectionObserver-based; paired with the
`.reveal-3d` CSS class in index.css and the `Reveal` wrapper component
in components/common/Reveal.jsx — a perspective/rotateX/translateY
entrance the first time an element scrolls into view, with a stagger
via inline `transition-delay`) and `useTilt` (pointer-following 3D card
tilt via CSS custom properties, paired with the `.tilt` class — used on
the hero PriceExplorer card and each ServiceCard). Both respect
prefers-reduced-motion via the existing global transition-duration
override in index.css. `useScrollReveal` falls back to revealing
immediately if IntersectionObserver isn't available, so content can
never get stuck invisible.

## Backend
Node.js + Express. CommonJS modules.

## Database
Postgres, hosted on Supabase. No ORM — plain SQL via `pg`
(node-postgres) through a single connection pool
(server/src/db/pool.js). Auth is Supabase Auth as of Session 4 (see
Authentication below) — credentials/sessions/lockout are Supabase's;
this app's own tables hold everything else. Supabase Storage and RLS
are still not used (see TODO.md/SECURITY for the RLS tradeoff now that
`public.users.id` is tied to `auth.uid()`).

Schema lives in server/src/db/schema.sql (idempotent — safe to re-run):
tables `users`, `services`, `packages`, `country_pricing`, `projects`,
`payments`, `project_files`, `notifications`, `activity_logs`,
`inquiries`. All ids are `uuid`; every table has a trigger that
maintains `updated_at`. `users` is a profile table now, not a
self-contained user store — its `id` is a foreign key straight to
Supabase's own `auth.users(id)` (see Authentication below), and it no
longer holds a password or login-lockout columns. `auth.users` is
provisioned by Supabase itself; schema.sql assumes it exists rather
than creating it — running schema.sql against a bare Postgres with no
`auth` schema will fail (correctly — see TEST_STATUS.md for how this
was still tested locally).

Apply the schema: `npm run db:migrate` (server/), against `DATABASE_URL`.

Data access: server/src/models/*.js are plain modules exporting async
functions (`create`, `findById`, etc.) that run parameterized SQL and
return camelCase JS objects — not Mongoose-style documents. `Package`,
`CountryPricing`, and `Project` shape their `service`/`package`/
`customer` fields as nested `{ id, name, ... }` objects on read (via a
SQL join + `json_build_object`), so controller and client code that
expected Mongoose's `.populate()` shape didn't need to change.

Money columns (`numeric`) come back from `pg` as strings by default;
server/src/db/pool.js installs a global type parser (oid 1700) so they
arrive as JS numbers instead — see DECISIONS.md.

Migration tooling is intentionally minimal (a single SQL file + a
runner script), not a full migration framework — see DECISIONS.md and
TODO.md/TECHNICAL DEBT.

## Authentication
Supabase Auth (Session 4) — credentials, password hashing, and session
issuance are Supabase's responsibility now, not this app's. The REST
shape the client talks to is unchanged: POST /api/auth/register, POST
/api/auth/login, POST /api/auth/logout, GET /api/auth/me — this app
stays the only thing the browser talks to; it's a backend-for-frontend
in front of Supabase Auth, not a switch to client-side Supabase auth.
That's a deliberate choice, not an oversight — see DECISIONS.md.

- `register`: server/src/lib/supabase.js's admin client creates the
  Supabase Auth user (`auth.admin.createUser`), then inserts a matching
  profile row into `public.users` (server/src/models/User.js), then
  signs in immediately to log the new user in. If the profile insert
  fails, the Supabase Auth user is rolled back
  (`auth.admin.deleteUser`) so there's no orphaned auth account with no
  profile.
- `login`: `auth.signInWithPassword`, then loads the `public.users`
  profile by the returned user id, checks `is_active`.
- `logout`: `auth.admin.signOut(accessToken)` — actually revokes the
  refresh token server-side. A real improvement over the old
  custom-JWT logout, which could only clear the cookie (a signed JWT
  can't be invalidated without a blocklist).
- Session storage: two httpOnly cookies, `sb_access_token` and
  `sb_refresh_token` (server/src/utils/sessionCookies.js) — not
  localStorage, same XSS-reduction rationale as before.
- `protect` middleware (server/src/middleware/auth.js) verifies the
  access token locally (no network call) via the project's legacy JWT
  secret (server/src/utils/supabaseJwt.js), then loads the
  `public.users` profile. On an expired access token, it attempts one
  silent refresh via `auth.refreshSession` (needs the network) before
  failing. See that file for the asymmetric-signing-key caveat if your
  Supabase project doesn't expose the legacy shared secret.
- Account lockout / login rate limiting is now Supabase's job, not this
  app's — `users.login_attempts`/`lock_until` columns are gone. This
  app still has its own express-rate-limit on /api/auth/* as
  defense-in-depth (unchanged from before).

CSRF mitigation currently: SameSite cookie (Lax in dev, None+Secure in
production — see below) + strict CORS allow-list. A full CSRF token is
not yet implemented — see TODO/SECURITY.

Cross-domain production note: this app's chosen production shape (client
on Vercel, API on Railway/Render) puts the frontend and API on different
top-level domains, so cookies need SameSite=None+Secure to be sent on
those cross-site requests at all — SameSite=Lax (the dev default) would
silently drop the cookie on every request. Fixed (Session 14):
`sessionCookies.js` switches to SameSite=None once `NODE_ENV=production`;
Secure is already tied to `req.secure`, which is true in production
(HTTPS end-to-end on both hosts). See DEPLOYMENT.md.

## Authorization
Role-based: `customer` / `admin`. `protect` middleware verifies the JWT
and loads the user from Postgres, `authorize('admin')` gates admin-only
routes. Ownership checks (customer can only see their own project) are
implemented for Projects — see below.

## API
REST under /api. Implemented: /api/auth, /api/services, /api/packages,
/api/pricing (+ /api/pricing/countries), /api/inquiries, /api/projects,
/api/users, /api/payments (Session 14), /api/projects/:id/files
(Session 14).
Not implemented: /api/notifications.

### Admin-only "all rows" endpoints (Session 5)
`GET /api/services`, `GET /api/packages`, and `GET /api/pricing` only ever
return active rows — correct for the public site, but it meant an admin
screen built on them could never see (or re-enable) something it had just
deactivated. Added, admin-only, alongside the existing public routes:
`GET /api/services/admin/all`, `GET /api/packages/admin/all`,
`GET /api/pricing/admin/all` — same shape as the public list, no active
filter. The public routes and their behavior are unchanged.

### Users (Session 5, new)
- `GET /api/users` (admin only): every profile, customers and admins,
  newest first. Powers the admin Customers tab.
- `PATCH /api/users/:id` (admin only): narrow — only `isActive` and
  `role` are editable this way (not name/email/phone, which stay
  customer-editable-only for now). Setting `isActive: false` is a real,
  functioning disable: `protect` middleware already rejected inactive
  accounts (server/src/middleware/auth.js, `loadProfile`) before this
  endpoint existed — this just completes the missing "admin sets it"
  half. An admin can't disable or demote their own account (checked
  server-side in userController.js, not just hidden in the UI).

### Projects
- `POST /api/projects` (customer): looks up an active CountryPricing row
  for {country, service, package} (falls back to "International", same
  rule as /api/pricing), sets totalAmount/advanceAmount (50%)/
  remainingAmount, status starts at `Awaiting Payment`, writes an
  ActivityLog "Project created" entry.
- `GET /api/projects` (any authenticated user): admin sees all, customer
  sees only their own (`WHERE customer_id = $1`).
- `GET /api/projects/:id` (any authenticated user): ownership enforced in
  the controller (`isOwner` helper) — non-owner non-admin gets 403.
- `PATCH /api/projects/:id/status` (admin only): validates status against
  `Project.STATUSES`, writes an ActivityLog "Status changed" entry with
  {from, to}.
- Verified end-to-end against a real local Postgres this session:
  create (correct 50/50 split), owner GET, IDOR 403, non-admin PATCH
  403, admin PATCH 200 + ActivityLog row. Automated as
  server/tests/integration/projects-db.test.js (opt-in, see
  TEST_STATUS.md) — still needs a run against the actual Supabase
  instance before calling it production-verified.

## File Storage
Supabase Storage (Session 14). Private bucket (`project-files` by
default, `SUPABASE_STORAGE_BUCKET` to override) — uploads go through
`server/src/controllers/fileController.js` via multer (memory storage,
25MB cap, declared-Content-Type allowlist), downloads through
short-lived (60s) signed URLs, never a public bucket URL. Ownership:
upload/list/download require the project's owner or an admin; delete is
admin-only. Not true MIME sniffing or AV scanning — see TODO.md/SECURITY.

## Payments
Stripe Checkout (Session 14) — `server/src/controllers/paymentController.js`.
`POST /api/payments/checkout` creates a Checkout Session for a project's
`advanceAmount` or `remainingAmount` (hosted redirect, no Stripe Elements,
so no publishable key needed client-side) and stores a `Pending` `payments`
row keyed to the session id. `POST /api/payments/webhook` (mounted
directly in app.js, before `express.json()` — Stripe's signature check
needs the raw body) verifies the signature and marks the row `Paid` on
`checkout.session.completed`, advancing the project to `Payment
Confirmed` if it's still pre-advance-payment (`Inquiry`/`Awaiting
Payment`) — a late/duplicate webhook can't clobber a project an admin
already moved further along. `GET /api/payments/verify/:sessionId`
re-checks the session with Stripe directly and applies the same
idempotent logic — a fallback for local dev (no `stripe listen` running)
so the dashboard doesn't show a stale status despite a successful
payment; safe to call even after the webhook already ran.

The 50% advance is now a real gate, not just a stored split:
`PATCH /api/projects/:id/status` refuses to set `Project Started` unless
a `payments` row for that project has `type = 'advance'` and
`status = 'Paid'` (`Payment.hasPaidAdvance`, checked in
`projectController.js`). `GET /api/projects` and `GET /api/projects/:id`
both include an `advancePaid` boolean (a SQL `exists()` subquery in
`Project.js`) so the client doesn't need a second request to know
whether to show "Pay Now" or "Paid ✓".

Not implemented: Stripe itself has not been called live from this
sandbox (no network access to api.stripe.com) — see TEST_STATUS.md/
DEPLOYMENT.md for what's mocked-tested vs. what still needs a real
test-mode run.

## Country Pricing
Explicit per-country rows: country, currency, service, package, price,
active — no automatic currency conversion. Lookup falls back to an
"International" tier if no row exists for the requested country.

### Auto-detected country (Session 6)
On first visit (no prior manual choice in localStorage), CountryContext
(client/src/context/CountryContext.jsx) calls
client/src/utils/geolocateCountry.js, which hits ipapi.co client-side
(IP-based, no permission prompt, no key) and matches the returned
country name against the real supported-country list from
`/api/pricing/countries`. A match becomes the default; no match — or
the API failing/timing out — falls back to "International", same as
before this existed. A manual choice (CountrySelector, in the Navbar)
always overrides and persists to localStorage from that point on; the
selector shows a small dot + tooltip when the current country was
auto-detected rather than chosen. The hero PriceExplorer's footer note
says explicitly when a rate is showing because of detected location, so
the pricing logic stays visible per the brief's requirement, not
silently applied.
Not verified live — see AI_AGENT_HANDOFF.md and geolocateCountry.js's
own comments; the sandbox this was built in has no network egress to
ipapi.co to test against.

## Customer / Admin Dashboard
Customer dashboard shows real project data from the Projects API.
Admin dashboard (Session 5) is a real, tabbed screen — not a shell —
at client/src/pages/admin/, one component per tab under
admin/tabs/: Overview (aggregate counts + status breakdown, computed
client-side from the list endpoints below — no separate stats
endpoint), Projects (list all + change status, using the existing
PATCH /api/projects/:id/status), Customers (list + enable/disable +
promote/demote, using the new /api/users), Services / Packages /
Pricing (full CRUD against the existing admin create/update/delete
routes, using the new admin/all list routes so inactive rows stay
visible and editable). Inquiries is read-only — the backend only has
create + list, no update/convert-to-project endpoint yet (see TODO.md).

## External Integrations
WhatsApp: client-side `wa.me` link with a prefilled message, no backend
involvement, no sensitive data included.
Google Form: link surfaced after inquiry submission, alongside a clear
explanation of what happens next (no silent redirect).

## Deployment
Not configured. No Dockerfile, CI, or hosting target chosen yet. Database
is Supabase-hosted, so no self-managed Postgres instance is needed in
production — only DATABASE_URL.
