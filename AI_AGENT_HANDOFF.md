# Latest Agent Handoff

## Project
International Web & Design Services Platform

## Current Phase
Session 5 — UI/UX refresh + real Admin Dashboard

## Current Task
User asked to (1) update the site's UI/UX with a fresh visual direction
(referenced monica.im as inspiration — no browser tool was available
this session, so this was not actually viewed; a modern SaaS-style
direction was used instead, see DECISIONS.md), (2) add sections to the
home page, and (3) build a real Admin Dashboard (was a placeholder
shell through Session 4).

## Completed
- Design tokens refreshed (client/tailwind.config.js, index.css,
  index.html fonts): new `signal` (cobalt blue, primary accent) and
  `coral` tokens, Space Grotesk + Inter fonts. `jade`/`brass` kept but
  repurposed as state colour only. See ARCHITECTURE.md/"Design system".
- Navbar and Footer rebuilt on the new tokens; Navbar now has a working
  mobile menu (there wasn't one before — nav links were just hidden
  below `md`).
- Home page (client/src/pages/Home.jsx) rebuilt with new sections: an
  interactive hero (client/src/components/home/PriceExplorer.jsx — pick
  a country, see real per-country prices update live; the actual
  product differentiator, not a generic hero), a facts strip, restyled
  services grid (new client/src/components/common/ServiceIcon.jsx, five
  hand-rolled SVGs), a "how it works" sequence, a live rate-compare
  section across every seeded country
  (client/src/components/home/RateCompare.jsx), an honest value-props
  section, and a final CTA. Deliberately no fabricated testimonials or
  client counts — Portfolio.jsx already established a
  no-invented-client-names rule in this repo; the home page follows it.
- Other pages (Login/Register/Contact/NotFound/Process/ServiceDetail/
  Services/AdvancePaymentNotice) had their primary-accent classes
  swapped from `jade` to `signal` for palette consistency — not
  otherwise redesigned. See TODO.md for the gap this leaves.
- Real Admin Dashboard (client/src/pages/admin/): tabbed shell
  (AdminDashboard.jsx) over 7 tabs in admin/tabs/ — Overview, Projects,
  Customers, Services, Packages, Pricing, Inquiries. Shared UI
  primitives in admin/ui.jsx.
- Backend additions to support the dashboard (all admin-only,
  `protect` + `authorize('admin')`):
  - `GET /api/services/admin/all`, `/api/packages/admin/all`,
    `/api/pricing/admin/all` — the existing public list endpoints only
    ever return active rows, which made deactivating something from an
    admin screen make it disappear with no way to reactivate. These
    return everything. Public routes are unchanged.
  - `GET /api/users` and `PATCH /api/users/:id` (new
    server/src/routes/userRoutes.js + controllers/userController.js) —
    list all accounts; the PATCH only allows `isActive`/`role`. This
    completes account-disabling: `protect` middleware already rejected
    inactive accounts, there was just no way for an admin to set the
    flag. See DECISIONS.md for why the PATCH is scoped this narrowly.
  - `server/src/models/{Service,Package,CountryPricing,User}.js` each
    got the corresponding model function (`listAllAdmin`, or
    `listAll`/`update` for User).
- New test suite: tests/integration/admin.test.js — no-session 401
  coverage for all 5 new routes, same pattern as the existing
  projects.test.js auth-gate tests.

## In Progress
Nothing left mid-way — this session ended on a clean boundary.

## Files Changed
Backend: server/src/models/{Service,Package,CountryPricing,User}.js,
server/src/controllers/{serviceController,packageController,
pricingController}.js (added admin list fn), new
server/src/controllers/userController.js, server/src/routes/
{serviceRoutes,packageRoutes,pricingRoutes,index}.js, new
server/src/routes/userRoutes.js, new
server/tests/integration/admin.test.js.
Frontend: client/tailwind.config.js, client/index.html, client/src/
index.css, client/src/pages/Home.jsx (rewritten), client/src/
components/layout/{Navbar,Footer}.jsx (rewritten), new client/src/
components/home/{PriceExplorer,RateCompare}.jsx, new client/src/
components/common/ServiceIcon.jsx, removed client/src/components/
common/PriceTicker.jsx (superseded), new client/src/pages/admin/
{AdminDashboard.jsx (rewritten),ui.jsx,tabs/*.jsx} (7 tab files),
accent-colour swap only in client/src/pages/{Contact,Login,NotFound,
Process,Register,ServiceDetail,Services}.jsx and client/src/components/
common/AdvancePaymentNotice.jsx, client/src/pages/Pricing.jsx (CTA
colour only).
Docs: this file, PROJECT_STATUS.md, TODO.md, ARCHITECTURE.md,
DECISIONS.md, TEST_STATUS.md.

## Tests Performed
- server: `npm test` — 24/24 passing, 1 suite (5 tests) self-skipped
  (needs RUN_DB_TESTS=1 + real Postgres, unchanged from Session 4)
- client: `npm run build` — compiles cleanly, 130 modules
- No live-database verification was possible (same sandbox limitation
  as every prior session) — the new admin/all + /api/users endpoints
  and the entire Admin Dashboard UI are code-reviewed and build-clean
  but not exercised against real data. This is the single biggest gap
  to close before trusting this session's work — see Blockers/BUGS.

## Known Bugs
None known. See TODO.md/BUGS for the standing "not yet live-verified"
caveat, now extended to this session's additions.

## Blockers
No live Supabase/Postgres instance was available in this sandbox
(same as every prior session) — the new admin-only endpoints and the
Admin Dashboard that calls them are untested against real data. No
browser tool was available either, so "make it look like monica.im"
could not be verified against the actual site — see Current Task.

## Important Technical Details
- The three new `/admin/all` routes exist because the public list
  routes filter to `is_active = true` unconditionally — there was
  previously no way for an admin UI to see or re-enable something it
  had just deactivated. See ARCHITECTURE.md/"Admin-only 'all rows'
  endpoints" and DECISIONS.md.
- `PATCH /api/users/:id` only accepts `isActive` and `role` — not
  name/email/phone. An admin can't disable or demote themselves
  (checked server-side, not just hidden in the UI). See DECISIONS.md.
- The Admin Dashboard's Overview tab computes all its stats
  client-side from the existing list endpoints — there's no dedicated
  `/api/admin/stats` endpoint, deliberately, to avoid adding a route
  that just re-aggregates data already available elsewhere.
- Inquiries tab in the admin dashboard is read-only — the backend has
  no update/convert-to-project endpoint yet (TODO.md/NEXT).
- Design tokens are still named `jade`/`brass` in
  tailwind.config.js even though they're no longer the primary brand
  colour (now state colour only) — see the comment in that file and
  DECISIONS.md before assuming the name implies the role.

## Next Exact Task
1. Get real Supabase credentials and run through the Session 4
   verification checklist that's still outstanding (TODO.md/NOW) —
   this blocks trusting Auth, and by extension everything built on
   `protect` this session too.
2. Once there's a live DB: manually exercise the Admin Dashboard end
   to end — create/edit/delete a service, package, and pricing row;
   change a project's status; disable and re-enable a customer
   account; confirm a disabled account is actually rejected by
   `protect` on its next request. Add the admin-vs-customer 403 test
   case for the 5 new routes (tests/integration/admin.test.js only has
   the no-session 401 case right now, matching the existing
   projects.test.js pattern).
3. Then: Stripe integration (TODO.md/NOW), still the biggest
   unstarted feature.
4. If full visual consistency across the whole site matters before
   launch, revisit the pages listed in TODO.md/NEXT that only got a
   colour-token swap this session (Login, Register, Contact,
   ServiceDetail, Services, Portfolio, About, Process, FAQ, customer
   Dashboard) — Home + Navbar + Footer + Admin Dashboard are the only
   fully redesigned surfaces.

## Next Files To Inspect
server/src/controllers/userController.js, server/src/routes/
userRoutes.js, client/src/pages/admin/AdminDashboard.jsx and
admin/tabs/*.jsx, client/tailwind.config.js

## Do Not Redo
Auth (Supabase Auth), Services, Packages, CountryPricing, Inquiries,
Projects API, the MongoDB->Postgres migration, the custom-JWT->Supabase
migration, the new admin/all + /api/users endpoints, the Admin
Dashboard UI, the Home page rebuild — extend, don't rebuild or revert.
The accent-colour-only pages (see Important Technical Details) are
intentionally left as a smaller follow-up, not an oversight to redo
from scratch.

## Recommended Next Action
Get real Supabase credentials, verify Auth live (Session 4's
outstanding task), then manually exercise the new Admin Dashboard
against real data before trusting it, then start Stripe integration.

========================================
LATEST HANDOFF
========================================

DATE: Session 1

AGENT: Claude (Sonnet, claude.ai sandbox)

CURRENT PHASE: Foundation — complete

COMPLETED: Auth, Services, Packages, CountryPricing, Inquiries (API +
frontend), security middleware, docs

IN PROGRESS: none

FILES CHANGED: entire repo (fresh scaffold)

TESTS: server 8/8 passing, client build passing, DB-dependent paths
untested (no MongoDB in this sandbox)

KNOWN BUGS: none known

BLOCKERS: no live MongoDB instance available this session

NEXT EXACT TASK: see "Next Exact Task" above — Projects API

FILES TO INSPECT: see "Next Files To Inspect" above

IMPORTANT NOTES: JWT via httpOnly cookie; country pricing never converts
currency; legal pages are placeholders needing review

DO NOT REDO: Auth, Services, Packages, CountryPricing, Inquiries

NEXT AGENT ACTION: connect MongoDB, seed, verify tests, implement Projects API

========================================
LATEST HANDOFF
========================================

DATE: Session 2

AGENT: Claude (Sonnet, claude.ai sandbox)

CURRENT PHASE: Projects API

COMPLETED:
- Projects API: POST /api/projects (customer, computes totalAmount/
  advanceAmount/remainingAmount from CountryPricing with the same
  International fallback as /api/pricing), GET /api/projects (admin=all,
  customer=own), GET /api/projects/:id (ownership check, 403 for
  non-owner), PATCH /api/projects/:id/status (admin only, writes
  ActivityLog on every change)
- server/src/controllers/projectController.js,
  server/src/routes/projectRoutes.js,
  server/src/validators/projectValidators.js — mounted in
  server/src/routes/index.js
- client/src/pages/Pricing.jsx — "Start this project" button per
  package, posts to /api/projects, redirects to /dashboard (or /login
  if signed out)
- client/src/pages/customer/Dashboard.jsx — replaced placeholder with a
  real project list from GET /api/projects (status, total/advance/
  remaining)
- server/tests/integration/projects.test.js — 401 auth-gate tests for
  all four routes

IN PROGRESS: none — clean boundary

FILES CHANGED:
server/src/controllers/projectController.js (new)
server/src/routes/projectRoutes.js (new)
server/src/validators/projectValidators.js (new)
server/src/routes/index.js (mount projects router)
server/tests/integration/projects.test.js (new)
client/src/pages/Pricing.jsx (start-project action)
client/src/pages/customer/Dashboard.jsx (real project list)
PROJECT_STATUS.md, TODO.md, ARCHITECTURE.md, DECISIONS.md,
TEST_STATUS.md (updated)

TESTS: server 12/12 passing (`cd server && npm test`); client build
passing (`cd client && npm run build`, 121 modules). Projects tests only
cover the no-session 401 path — no MongoDB in this sandbox, same
limitation as Session 1.

KNOWN BUGS: none known — Projects API untested against a live DB, so
correctness of the pricing lookup / ownership check / activity log is
unverified beyond code review.

BLOCKERS: still no MongoDB instance in this sandbox. Everything that
needs real data (project creation math, IDOR 403, admin status update +
ActivityLog row) is blocked on that.

IMPORTANT TECHNICAL DETAILS:
- New project status on create is `Awaiting Payment`, not `Inquiry` —
  see DECISIONS.md
- Ownership check (`isOwner` in projectController.js) returns 403, not
  404, for a non-owner — see DECISIONS.md
- Pricing lookup for project creation duplicates the fallback logic in
  pricingController.js (find exact country row, else "International")
  rather than importing it, to keep the controllers independent — if
  the fallback rule changes, update both places
- Pricing.jsx assumes `entry.service._id` / `entry.package._id` are
  present on populated CountryPricing rows (they are, per
  pricingController.js's .populate calls)

NEXT EXACT TASK:
Get a MongoDB instance connected (local `mongod` or Atlas) and actually
exercise the Projects API before building anything else on top of it:
1. `npm run seed` (server/.env needs MONGO_URI)
2. Register a customer + an admin (or use SEED_ADMIN_EMAIL/PASSWORD)
3. POST /api/projects as the customer for a seeded service+package+
   country combo — confirm totalAmount/advanceAmount/remainingAmount
   match the seeded CountryPricing row
4. Register a second customer, GET the first customer's project by id —
   confirm 403
5. PATCH .../status as the admin — confirm 200 and a new ActivityLog row
   with {from, to}
6. Turn each of the above into a real Jest integration test (replacing
   the TODO note at the bottom of projects.test.js), ideally with
   mongodb-memory-server so it doesn't need a real DB in CI
Only after that: start the Stripe integration (TODO.md NOW section) —
checkout session for a project's advanceAmount, webhook handler, sync
Payment + Project status.

FILES TO INSPECT:
server/src/controllers/projectController.js,
server/src/routes/projectRoutes.js, server/src/models/Payment.js,
server/src/models/Project.js, server/.env.example

IMPORTANT NOTES: same JWT/CSRF/CORS caveats as Session 1 (see
ARCHITECTURE.md). Legal pages still placeholders.

DO NOT REDO: Auth, Services, Packages, CountryPricing, Inquiries,
Projects API (create/list/get/status) — extend, don't rebuild.

NEXT AGENT ACTION: connect MongoDB, seed, run the 6-step Projects
verification above, write the real IDOR/role/activity-log tests, then
start Stripe checkout + webhook integration

========================================
LATEST HANDOFF
========================================

DATE: Session 3

AGENT: Claude (Sonnet, claude.ai sandbox)

CURRENT PHASE: Database migration (MongoDB -> Supabase Postgres)

COMPLETED:
- Full backend migration off MongoDB/Mongoose to Postgres via plain `pg`
  (no ORM), targeting Supabase. Scope was explicitly "database only" —
  custom JWT/bcrypt auth is unchanged, not Supabase Auth/RLS.
- server/src/db/schema.sql — full schema (10 tables, uuid PKs,
  updated_at triggers), idempotent, applied and verified against a real
  local Postgres 16 instance this session.
- server/src/db/pool.js — pg Pool + a global NUMERIC type parser (see
  DECISIONS.md — without it, money fields come back as strings and
  `.toLocaleString()` breaks client-side).
- server/src/db/migrate.js — `npm run db:migrate` (also at the repo
  root).
- Every model file (server/src/models/*.js) rewritten as plain
  data-access modules (create/find/update/etc. over parameterized SQL),
  replacing Mongoose schemas. Package/CountryPricing/Project shape
  populated fields via SQL joins + json_build_object to match the old
  `.populate()` response shape, so most client code didn't need to
  change.
- Every controller rewritten: auth, service, package, pricing, inquiry,
  project. middleware/auth.js, config/db.js updated. app.js: dropped
  express-mongo-sanitize (Mongo-specific, irrelevant now).
  middleware/errorHandler.js: Mongoose CastError handling replaced with
  Postgres error-code handling (23505 unique, 23503 FK, 23502 not-null,
  22P02 invalid input, 23514 check constraint).
- seed/seed.js rewritten for the new models.
- Client: all `_id` references changed to `id` (client/src/pages/
  Pricing.jsx, client/src/pages/customer/Dashboard.jsx).
- server/.env.example: MONGO_URI -> DATABASE_URL, with a note on which
  Supabase pooler mode to use.
- server/package.json: mongoose + express-mongo-sanitize removed, pg
  added, db:migrate script added.
- Actually verified against a live database (installed Postgres 16
  locally in the sandbox to do this, not just code review): ran
  db:migrate, ran seed, booted the server, and drove the full auth +
  Projects flow by hand with curl — register x2, admin login, create
  project (correct 50/50 split), owner GET (200), other customer GET
  (403, IDOR), non-admin PATCH status (403), admin PATCH status (200) +
  confirmed the ActivityLog rows in the DB directly. Then wrote that up
  as server/tests/integration/projects-db.test.js (opt-in via
  RUN_DB_TESTS=1, skipped by default) and re-ran it as an automated
  suite — 5/5 passing.
- Found and fixed two real bugs this way that no amount of code review
  would have caught: CountryPricing.js and Project.js had `create`/
  `update` statements using a `cp.`/`p.` table-alias-prefixed column
  list in a RETURNING clause with no such alias present (INSERT/UPDATE
  target the bare table name). Both fixed — see git diff on those
  files and DECISIONS.md.
- Docs updated: PROJECT_STATUS.md, TODO.md, ARCHITECTURE.md,
  DECISIONS.md, TEST_STATUS.md, README.md, root package.json.

IN PROGRESS: none — clean boundary.

FILES CHANGED:
server/src/db/schema.sql (new), server/src/db/pool.js (new),
server/src/db/migrate.js (new),
server/src/models/*.js (all 10, rewritten),
server/src/controllers/{auth,service,package,pricing,inquiry,project}Controller.js
(all rewritten), server/src/middleware/{auth,errorHandler}.js,
server/src/config/db.js, server/src/app.js, server/src/seed/seed.js,
server/src/validators/projectValidators.js (isMongoId -> isUUID),
server/.env.example, server/package.json,
server/tests/integration/projects-db.test.js (new),
server/tests/setup.js (dummy DATABASE_URL so plain `npm test` doesn't
warn), client/src/pages/Pricing.jsx, client/src/pages/customer/
Dashboard.jsx, package.json (root), PROJECT_STATUS.md, TODO.md,
ARCHITECTURE.md, DECISIONS.md, TEST_STATUS.md, README.md.

TESTS:
- `cd server && npm test` — 5 suites, 12 tests passing, no DB required
  (the new projects-db suite self-skips without RUN_DB_TESTS=1).
- `cd server && RUN_DB_TESTS=1 DATABASE_URL=<local-postgres> npx jest
  tests/integration/projects-db.test.js --runInBand` — 5/5 passing,
  verified this session against a real (local, not Supabase) Postgres.
- `cd client && npm run build` — passing, 120 modules.
- Services/Packages/CountryPricing admin CRUD code was rewritten for
  Postgres but NOT re-exercised live this session (only the read paths
  used indirectly by Projects — country_pricing lookup — were). Worth
  a quick pass before trusting the admin CRUD routes.

KNOWN BUGS: none currently known. Two were found and fixed this session
(see COMPLETED) — flagging in case a similar `<alias>.column` pattern
was copy-pasted somewhere not yet exercised live (grep for
`returning \`\${COLUMNS}\`` patterns where COLUMNS has a table-alias
prefix, in any model file, if something like this resurfaces).

BLOCKERS: none for continuing development — the sandbox's local
Postgres is gone at session end (ephemeral), but the code, schema, and
docs are all in the repo. The real blocker is: this has not yet been
verified against the actual Supabase project, only a local stand-in.

IMPORTANT TECHNICAL DETAILS:
- DATABASE_URL replaces MONGO_URI. See server/.env.example for the
  Supabase pooler-mode caveat (use Session pooler / port 5432, not the
  Transaction pooler / pgbouncer / port 6543 — parameterized queries
  aren't guaranteed reliable there).
- Money fields are JS numbers, not strings, thanks to the NUMERIC type
  parser in db/pool.js — don't remove it without checking every
  `.toLocaleString()` call and every arithmetic op on price fields.
- `isOwner`/403-not-404 and `Awaiting Payment`-on-create decisions from
  Session 2 are unchanged by this migration — same behavior, new
  storage.
- Migration tooling is intentionally minimal (one schema.sql, no up/
  down migrations) — fine for now since there's no production data yet,
  see DECISIONS.md and TODO.md/TECHNICAL DEBT for when to revisit.

NEXT EXACT TASK:
1. Get the actual Supabase project's DATABASE_URL, run `npm run
   db:migrate` against it, then `npm run seed`.
2. Re-run `RUN_DB_TESTS=1 DATABASE_URL=<supabase-url> npx jest
   tests/integration/projects-db.test.js --runInBand` (server/) against
   it — confirm the pooler mode works with `pg`'s parameterized
   queries as expected (see IMPORTANT TECHNICAL DETAILS above).
3. Do a quick manual pass on the admin CRUD routes that weren't
   exercised live this session: POST/PUT/DELETE on /api/services,
   /api/packages, /api/pricing as an admin user — these were rewritten
   for Postgres but only checked by code review, not a live run.
4. Only after that: start the Stripe integration (TODO.md NOW section)
   — checkout session for a project's advanceAmount, webhook handler,
   sync Payment + Project status.

FILES TO INSPECT:
server/.env.example, server/src/db/schema.sql, server/src/db/pool.js,
server/src/controllers/serviceController.js,
server/src/controllers/packageController.js,
server/src/controllers/pricingController.js, server/src/models/Payment.js

IMPORTANT NOTES: same JWT/CSRF/CORS caveats as Session 1 (see
ARCHITECTURE.md). Legal pages still placeholders. RLS is NOT enabled on
the Supabase tables — this app is 100% server-side-authorization, same
as before (see TODO.md/SECURITY if that ever needs to change).

DO NOT REDO: Auth, Services, Packages, CountryPricing, Inquiries,
Projects API (create/list/get/status), the MongoDB->Postgres migration
itself — extend, don't rebuild or revert.

NEXT AGENT ACTION: point DATABASE_URL at the real Supabase project,
migrate + seed it, re-run the DB-backed test suite against it, spot-check
admin CRUD routes live, then start Stripe checkout + webhook integration

========================================
LATEST HANDOFF
========================================

DATE: Session 4

AGENT: Claude (Sonnet, claude.ai sandbox)

CURRENT PHASE: Auth migration (custom JWT/bcrypt -> Supabase Auth)

COMPLETED:
- Replaced custom JWT + bcrypt auth with Supabase Auth
  (auth.admin.createUser, auth.signInWithPassword, auth.admin.signOut,
  auth.refreshSession). Scope this session was explicitly "add
  Supabase Auth, drop custom JWT" (see the scope question asked and
  answered).
- Kept the client on this app's own REST API (/api/auth/register,
  /login, /logout, /me) — did NOT switch to client-side supabase-js.
  Backend-for-frontend pattern, preserves the httpOnly-cookie session
  model. Zero client code changes needed for this migration — see
  DECISIONS.md for why.
- New: server/src/lib/supabase.js (admin client, service_role key),
  server/src/utils/supabaseJwt.js (local HS256 verification of
  Supabase-issued access tokens using the project's legacy JWT
  secret), server/src/utils/sessionCookies.js (sb_access_token /
  sb_refresh_token httpOnly cookie helpers).
- Rewrote: authController.js (register/login/logout/getMe),
  middleware/auth.js (protect — local verify, falls back to
  auth.refreshSession() on an expired access token using the refresh
  cookie).
- schema.sql: `users` table is now a profile table — dropped
  `password`, `login_attempts`, `lock_until`; `id` FKs to
  `auth.users(id)` (Supabase's own table, NOT created by this
  schema — schema.sql will fail against a bare Postgres with no
  `auth` schema, which is correct/expected).
- models/User.js: now profile-only CRUD (createProfile, findById,
  findByEmail), no password handling.
- seed.js: admin user creation goes through
  supabase.auth.admin.createUser + a profile insert; still no-ops
  cleanly if SEED_ADMIN_EMAIL/PASSWORD aren't set (verified).
- Removed: utils/password.js, utils/token.js and their unit tests
  (dead code — bcrypt hashing and our own JWT signing are gone).
  bcryptjs dependency removed from server/package.json;
  @supabase/supabase-js added; jsonwebtoken kept (verification only).
- .env.example: JWT_SECRET/JWT_EXPIRES_IN removed, replaced with
  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_JWT_SECRET.
- Testing, given this sandbox has NO network access to *.supabase.co:
  - server/tests/unit/supabaseJwt.test.js (new) — local JWT
    verification, fully live-tested (valid/wrong-secret/expired/
    missing-config), no network needed.
  - server/tests/unit/authController.test.js (new) — mocks
    @supabase/supabase-js to verify register/login controller logic:
    happy path, duplicate email, profile-insert-rollback, and two
    error-status-mapping cases.
  - server/tests/integration/projects-db.test.js (rewritten) — can no
    longer go through POST /api/auth/register (needs real network), so
    it now mints its own Supabase-shaped HS256 tokens directly and
    inserts profile rows, which still fully exercises `protect`'s real
    local-verification path + the entire Projects flow against a real
    local Postgres. Re-ran it end to end this session: 5/5 passing,
    same coverage as Session 3 (50/50 split, IDOR 403, role check 403,
    admin update 200 + ActivityLog row).
  - Manually booted the server with a syntactically-valid but
    unreachable SUPABASE_URL and hit POST /api/auth/register — this is
    what surfaced a real bug (below).
- Bug found and fixed by that manual test: register's error handling
  defaulted ANY Supabase error (including "Supabase is unreachable" /
  no `.status` on the error object) to HTTP 400 with the raw SDK
  message ("fetch failed") shown to the client. Fixed: infra/network
  failures (no `.status`) now return 502 with a generic message; real
  Supabase Auth errors (which DO carry a `.status`) still pass through
  unchanged. Locked in with two new tests in authController.test.js.
- Docs updated: ARCHITECTURE.md, DECISIONS.md, TODO.md,
  PROJECT_STATUS.md, TEST_STATUS.md, README.md.

IN PROGRESS: none — clean boundary.

FILES CHANGED:
server/src/lib/supabase.js (new), server/src/utils/supabaseJwt.js
(new), server/src/utils/sessionCookies.js (new),
server/src/utils/password.js (deleted), server/src/utils/token.js
(deleted), server/src/controllers/authController.js (rewritten),
server/src/middleware/auth.js (rewritten), server/src/models/User.js
(rewritten), server/src/db/schema.sql (users table), server/src/seed/
seed.js (admin creation), server/.env.example, server/package.json,
server/tests/unit/supabaseJwt.test.js (new),
server/tests/unit/authController.test.js (new),
server/tests/unit/password.test.js (deleted),
server/tests/unit/token.test.js (deleted),
server/tests/integration/projects-db.test.js (rewritten),
server/tests/setup.js (env vars), ARCHITECTURE.md, DECISIONS.md,
TODO.md, PROJECT_STATUS.md, TEST_STATUS.md, README.md.

TESTS:
- `cd server && npm test` — 5 suites, 19 tests passing, 1 suite (5
  tests) self-skips without RUN_DB_TESTS=1.
- `cd server && RUN_DB_TESTS=1 DATABASE_URL=<local-postgres>
  SUPABASE_JWT_SECRET=... npx jest tests/integration/projects-db.test.js
  --runInBand` — 5/5 passing, verified this session against a real
  (local, not Supabase) Postgres, with a fresh auth.users stub schema
  created in beforeAll purely for this sandbox test (NOT part of
  schema.sql, NOT shipped — real Supabase already has auth.users).
- `cd client && npm run build` — passing, 120 modules, no changes
  needed.
- Re-verified seed.js's non-auth logic (services/packages/pricing)
  still works: 5 services, 15 packages, 45 pricing rows, against a
  real local Postgres.
- NOT verified live: the actual Supabase Auth API calls themselves
  (admin.createUser, signInWithPassword, admin.signOut,
  refreshSession) — no network access to *.supabase.co in this
  sandbox. See TEST_STATUS.md for the full breakdown of
  live-vs-mocked coverage.

KNOWN BUGS: none currently known. One was found and fixed this session
(register's 400-vs-502 error mapping, see COMPLETED/DECISIONS.md).

BLOCKERS: none for continuing development. The real blocker, same
shape as last session: this has not been verified against the actual
Supabase project (Auth or DB), only local/mocked stand-ins. The
sandbox's local Postgres is gone at session end (ephemeral) — code,
schema, and docs are all that persist.

IMPORTANT TECHNICAL DETAILS:
- Cookies are now `sb_access_token` / `sb_refresh_token` (not `token`)
  — httpOnly, same SameSite=Lax/secure-in-prod pattern as before.
- `protect` verifies tokens locally via SUPABASE_JWT_SECRET (fast, no
  network) rather than calling `auth.getUser()` (network, but catches
  server-side revocation sooner) — see DECISIONS.md for the tradeoff
  and TODO.md for what to do if your Supabase project doesn't expose
  the legacy shared secret.
- Session revocation via logout doesn't take effect until the
  already-issued access token naturally expires (~1hr default) — a
  known, accepted limitation of local JWT verification.
- `email_confirm: true` is set on createUser to skip Supabase's own
  confirmation email, matching the pre-migration behavior (no email
  verification step existed before either). Revisit when building
  real email verification (TODO.md/NEXT).
- schema.sql's `users` table now requires `auth.users` to already
  exist — this is true on every real Supabase project automatically,
  but means `npm run db:migrate` will fail against a bare/local
  Postgres with no `auth` schema. That's intentional, not a bug.

NEXT EXACT TASK:
1. Get real SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY /
   SUPABASE_JWT_SECRET (Supabase dashboard: Settings -> API) and a
   real DATABASE_URL, put them in server/.env.
2. `npm run db:migrate && npm run seed` against the real project.
3. Manually walk through: register a customer -> confirm cookies are
   set and /api/auth/me returns the right profile -> log out -> log
   back in -> (optional) wait out the access token's lifetime or
   manually expire the cookie to confirm the silent-refresh path in
   `protect` actually works against real Supabase.
4. Confirm SUPABASE_JWT_SECRET is actually the right one for your
   project (Settings -> API -> JWT Secret) — if your project only
   offers asymmetric keys, protect's local verification needs to
   switch to `auth.getUser()` first (see supabaseJwt.js).
5. Re-run `RUN_DB_TESTS=1 npx jest tests/integration/projects-db.test.js`
   against the real Supabase Postgres.
6. Only after that: Stripe integration (TODO.md NOW section).

FILES TO INSPECT:
server/.env.example, server/src/lib/supabase.js,
server/src/utils/supabaseJwt.js, server/src/middleware/auth.js,
server/src/controllers/authController.js

IMPORTANT NOTES: RLS is still NOT enabled on the Supabase tables — this
app relies entirely on server-side checks via the service_role key
(which bypasses RLS anyway). Now that `public.users.id` == `auth.uid()`,
meaningful RLS policies could be written if a future feature ever needs
direct client-side Supabase access (see TODO.md/SECURITY). Legal pages
still placeholders.

DO NOT REDO: Auth (now Supabase Auth), Services, Packages,
CountryPricing, Inquiries, Projects API (create/list/get/status), the
MongoDB->Postgres migration, the custom-JWT->Supabase-Auth migration —
extend, don't rebuild or revert.

NEXT AGENT ACTION: get real Supabase credentials, migrate + seed the
real project, manually verify the full auth flow (including token
refresh) against it, re-run the DB-backed test suite against it, then
start Stripe checkout + webhook integration

========================================
LATEST HANDOFF
========================================

DATE: Session 5

AGENT: Claude (Sonnet, claude.ai sandbox)

CURRENT PHASE: UI/UX refresh + real Admin Dashboard — complete

COMPLETED: Design token refresh (new `signal`/`coral` accents, Space
Grotesk + Inter fonts); Navbar (now with a working mobile menu) and
Footer rebuilt; Home page rebuilt with an interactive per-country
pricing hero, a live rate-compare section, a process section, and an
honest value-props section (no fabricated testimonials/client
counts); every other page's primary-accent classes swapped from
`jade` to `signal` for consistency (not otherwise redesigned); a real
tabbed Admin Dashboard (Overview/Projects/Customers/Services/
Packages/Pricing/Inquiries) replacing the old placeholder shell;
backend additions to support it — GET .../admin/all for
services/packages/pricing (the public routes only ever return active
rows), and new GET/PATCH /api/users (list accounts, toggle
isActive/role — completes account-disabling, which `protect`
middleware already enforced but had no admin control for)

IN PROGRESS: none

FILES CHANGED: see "Files Changed" above (full list) — backend:
Service/Package/CountryPricing/User models + controllers + routes,
new userController.js/userRoutes.js, new admin.test.js; frontend:
Home.jsx, Navbar.jsx, Footer.jsx rewritten, new home/PriceExplorer.jsx
+ RateCompare.jsx, new common/ServiceIcon.jsx, PriceTicker.jsx
removed, new admin/AdminDashboard.jsx + admin/ui.jsx + 7 admin/tabs/
files, tailwind.config.js/index.css/index.html, accent-swap-only on
~8 other pages

TESTS: server 24/24 passing (1 suite/5 tests self-skipped, needs
RUN_DB_TESTS=1 + real Postgres — unchanged from Session 4), client
build clean (130 modules). No live-database verification was possible
this session either — the new admin endpoints and the Admin Dashboard
UI are code-reviewed and build-clean, not exercised against real
data. This is the main gap to close next.

KNOWN BUGS: none known

BLOCKERS: same as every prior session — no live Supabase/Postgres
instance in this sandbox. Also: no browser tool available, so the
requested "make it look like monica.im" reference could not actually
be checked against that site.

NEXT EXACT TASK: see "Next Exact Task" above — get real Supabase
credentials and verify Auth live (this was already outstanding from
Session 4 and now blocks trusting this session's admin endpoints
too), then manually exercise the Admin Dashboard against real data,
then Stripe integration.

FILES TO INSPECT: see "Next Files To Inspect" above

IMPORTANT NOTES: see "Important Technical Details" above — in
particular, `jade`/`brass` tokens are no longer the primary accent
(now state colour only, `signal` is primary) even though the names
didn't change; and the Admin Dashboard's Inquiries tab is read-only
because no update/convert endpoint exists on the backend yet.

DO NOT REDO: everything from prior sessions (Auth, Services,
Packages, CountryPricing, Inquiries, Projects API, the DB + Auth
migrations) plus this session's admin/all endpoints, /api/users,
the Admin Dashboard UI, and the Home page rebuild — extend, don't
rebuild or revert. The accent-colour-only pages are a known, smaller
follow-up, not something to redo from scratch.

NEXT AGENT ACTION: get real Supabase credentials, verify Auth live,
manually exercise the new Admin Dashboard end to end against real
data (create/edit/delete services/packages/pricing, change a
project's status, disable/re-enable a customer account), add the
admin-vs-customer 403 test case to admin.test.js, then start Stripe
checkout + webhook integration.

========================================
LATEST HANDOFF
========================================

DATE: Session 6

AGENT: Claude (Sonnet, claude.ai sandbox)

CURRENT PHASE: Location auto-detect + motion/icon pass — complete

COMPLETED: IP-based country auto-detection (client/src/utils/
geolocateCountry.js, calls ipapi.co client-side; CountryContext.jsx
rewritten to use it, only on first visit, always overridden by a
manual choice, not persisted on its own — see DECISIONS.md);
CountrySelector now shows a pin icon + a small dot/tooltip when the
country was auto-detected; PriceExplorer's footer note says so
explicitly (brief requires not hiding pricing logic). Motion: two new
hooks, useScrollReveal (IntersectionObserver 3D entrance, paired with
the `.reveal-3d` CSS class + Reveal.jsx wrapper) and useTilt
(pointer-following 3D card tilt, `.tilt` class) — no new dependency,
both respect prefers-reduced-motion, useScrollReveal has a safe
fallback if IntersectionObserver is unavailable. Applied across Home:
service cards (own ServiceCard.jsx component so each gets its own tilt
+ stagger), process steps, rate-compare cells, value-prop cards, final
CTA. Navbar gets a subtle shadow on scroll (useScrolled.js). A few more
hand-rolled icons (Icon.jsx: pin, check, chevron, chat) — WhatsApp
button and value-prop cards use them now.

IN PROGRESS: none

FILES CHANGED: new client/src/utils/geolocateCountry.js; rewritten
client/src/context/CountryContext.jsx; rewritten client/src/
components/common/CountrySelector.jsx; new client/src/hooks/
{useScrollReveal,useTilt,useScrolled}.js; new client/src/components/
common/{Reveal,Icon}.jsx; new client/src/components/home/
ServiceCard.jsx; edited client/src/components/home/{PriceExplorer,
RateCompare}.jsx, client/src/components/layout/Navbar.jsx, client/src/
components/common/WhatsAppButton.jsx, client/src/pages/Home.jsx,
client/src/index.css. No backend changes this session. Docs: this
file, ARCHITECTURE.md, DECISIONS.md, TODO.md, PROJECT_STATUS.md,
TEST_STATUS.md.

TESTS: server unaffected — 24/24 passing, unchanged from Session 5.
client `npm run build` — compiles cleanly, 137 modules (was 130). No
dedicated frontend test suite exists (unchanged limitation). The
geolocation call could NOT be exercised — this sandbox has no network
egress to ipapi.co — so it's implemented defensively (timeout,
try/catch, always resolves rather than throws, degrades to the
pre-existing "International" default) but genuinely unverified. See
Blockers and TODO.md/BUGS.

KNOWN BUGS: none known — see the geolocation caveat above, which is a
"not yet verified" gap, not a known bug.

BLOCKERS: same as every prior session — no live Supabase/Postgres
instance in this sandbox. New this session: no network egress to
ipapi.co either, so the auto-detect feature is unverified end-to-end.

NEXT EXACT TASK: from a real deployed origin (or anywhere with
outbound HTTPS access to ipapi.co), open the site in a fresh browser
profile (no localStorage) and confirm: (1) a country gets auto-detected
and matches what's expected for that IP, (2) the pin-dot/tooltip and
PriceExplorer footer note both reflect it, (3) picking a different
country in CountrySelector overrides it and persists across a reload,
(4) blocking or throttling the ipapi.co request (devtools network
override) still leaves the page fully usable at the "International"
default. Then continue with Session 5's outstanding next task: real
Supabase credentials, verify Auth live, exercise the Admin Dashboard
against real data, then Stripe integration.

FILES TO INSPECT: client/src/utils/geolocateCountry.js, client/src/
context/CountryContext.jsx — plus everything still outstanding from
Session 5's handoff above.

IMPORTANT NOTES: geolocateCountry.js is deliberately isolated so
swapping providers later only means editing that one file (see
DECISIONS.md). The `.reveal-3d`/`.tilt` CSS and both hooks are generic
— reusable on other pages, not Home-specific — if a future session
wants the same motion elsewhere.

DO NOT REDO: everything from prior sessions, plus this session's
CountryContext rewrite, geolocateCountry.js, and the
useScrollReveal/useTilt/useScrolled hooks — extend, don't rebuild.

NEXT AGENT ACTION: verify the geolocation feature live from a real
network, then pick up Session 5's outstanding next task (Supabase
credentials + live verification of Auth and the Admin Dashboard).

========================================
LATEST HANDOFF
========================================

DATE: Session 7

AGENT: Claude (Sonnet, claude.ai sandbox)

CURRENT PHASE: Primary nav content edit (Process -> Home) — complete.
User's message was numbered item "1." of what reads like a longer list
("update," trails off) — more items likely to follow.

COMPLETED: Primary Navbar (client/src/components/layout/Navbar.jsx)
`links` array: removed `{ to: '/process', label: 'Process' }`, added
`{ to: '/', label: 'Home', end: true }` as the first entry. Both
desktop and mobile `<NavLink>` renders now pass `end={l.end}` —
required because React Router v7's NavLink treats `to="/"` as a
path-prefix match by default, so without `end` the new Home link
would render "active" on every route, not just `/`. The `/process`
route and Process.jsx page were left untouched — still reachable
directly at /process and still linked from Home.jsx's "Full process
->" content link. "Navigation bar" was read as the top Navbar
specifically, not Footer (see Next Exact Task).

IN PROGRESS: none.

FILES CHANGED: client/src/components/layout/Navbar.jsx only. Docs:
this file, TODO.md.

TESTS: client `npm install` + `npm run build` — clean, 154 modules
(unchanged count, no new imports/files). Server untouched this
session, not re-run.

KNOWN BUGS: none known.

BLOCKERS: none for this task. Standing sandbox blockers unchanged (no
live Supabase/Postgres, no browser tool, no egress to ipapi.co) —
unrelated to this session's change.

NEXT EXACT TASK: Confirm with the user whether Footer.jsx's separate
`links` array (client/src/components/layout/Footer.jsx:14, still
`{ to: '/process', label: 'Process' }`) should get the same
Process->Home swap — same pattern, second file, intentionally left
alone since the request said "navigation bar." See TODO.md/NEXT.

FILES TO INSPECT: client/src/components/layout/Footer.jsx (if the
above is confirmed) — check whether Footer's links use NavLink
(prefix-matching, would need `end`) or plain Link (wouldn't) before
copying the same fix.

IMPORTANT NOTES: `end={l.end}` is only meaningful for the Home entry
(`end: true`); every other link object has no `end` key, so
`end={undefined}` on those NavLinks is a no-op, equivalent to
omitting the prop.

DO NOT REDO: everything from prior sessions (see above) plus this
session's Navbar links change — extend, don't revert to a `/process`
link in the primary nav.

NEXT AGENT ACTION: if the user confirms Footer.jsx too, apply the
matching edit there. Otherwise proceed to item 2+ of the user's list.

========================================
LATEST HANDOFF
========================================

DATE: Session 8

AGENT: Claude (Sonnet, claude.ai sandbox)

CURRENT PHASE: Free Tools footer links made admin-editable — complete.

COMPLETED: The Footer's "Free Tools" column (client/src/components/
layout/Footer.jsx) was a hardcoded `freeToolsLinks` array — user asked
for it to be editable from the admin dashboard, same as Services/
Portfolio/etc. Followed the existing Service/Portfolio CRUD pattern
end to end:
- New `free_tool_links` table (server/src/db/schema.sql): id, label,
  href, is_active, "order", timestamps + updated_at trigger — modeled
  directly on the `services` table's shape.
- server/src/models/FreeToolLink.js (listActive/listAllAdmin/findById/
  create/update/remove), server/src/controllers/freeToolController.js,
  server/src/validators/freeToolValidators.js (href intentionally NOT
  isURL()-checked — it's as often an internal path like "/tools" as a
  full external URL), server/src/routes/freeToolRoutes.js — mounted at
  /api/free-tools in routes/index.js. GET / is public (active only);
  GET /admin/all, POST /, PATCH /:id, DELETE /:id are
  protect+authorize('admin'), matching every other admin resource.
- server/src/seed/seed.js: seeds the 5 links that used to be hardcoded
  (Meta Tag & SEO Generator, Color Contrast Checker, 50% Milestone
  Calculator, Aspect Ratio Tool, All Free Tools Hub — all -> /tools) as
  core data, unconditionally like SERVICES (not gated behind
  SEED_DEMO_DATA like the fake customers/projects/reviews are), so a
  fresh install's Footer isn't empty. Wipe step added alongside the
  existing pricing/packages/services wipe.
- New admin dashboard tab (client/src/pages/admin/tabs/
  FreeToolsTab.jsx) — CRUD list + form, modeled closely on
  ServicesTab.jsx (label, href, order, isActive fields; toggle-active
  button like PortfolioTab's toggle-published). Wired into
  AdminDashboard.jsx's TABS/SUBTITLES and render block. New "tools"
  wrench icon added to AdminIcon.jsx (Feather's "tool" glyph, same
  style as the existing icon set).
- Footer.jsx now fetches GET /api/free-tools on mount and renders that
  instead of the hardcoded array — but keeps the same 5 entries as a
  local `DEFAULT_FREE_TOOLS_LINKS` fallback (shown immediately, kept on
  any fetch failure or empty API response) rather than risking an empty
  Footer column if the DB/API is unreachable (see README's Supabase-
  pause caveat). Also hardened `LinkColumn` (shared by all four Footer
  columns) to render `https?://` hrefs as a plain `<a target="_blank">`
  instead of react-router's `<Link>` — needed now that an admin could
  enter a full external URL, which `<Link to="https://...">` cannot
  handle correctly.
- tests/integration/admin.test.js: added
  `['get', '/api/free-tools/admin/all']` to the existing no-session
  401 auth-gate coverage, same shape as every other admin/all route.

IN PROGRESS: none.

FILES CHANGED: server/src/db/schema.sql; new server/src/models/
FreeToolLink.js, server/src/controllers/freeToolController.js,
server/src/validators/freeToolValidators.js, server/src/routes/
freeToolRoutes.js; server/src/routes/index.js; server/src/seed/seed.js;
server/tests/integration/admin.test.js; new client/src/pages/admin/
tabs/FreeToolsTab.jsx; client/src/pages/admin/AdminDashboard.jsx;
client/src/components/admin/AdminIcon.jsx; client/src/components/
layout/Footer.jsx. Docs: this file.

TESTS: server `npx jest --runInBand` — 9/10 suites run (1 skipped,
unchanged — the DB-dependent suite that needs RUN_DB_TESTS=1 + real
Postgres), 40/40 of the runnable tests pass (was 39 — the one new case
above). Client: `vite build` could NOT be run this session — the
uploaded node_modules only contains Windows-platform native binaries
for rollup/esbuild (@rollup/rollup-win32-x64-*,
esbuild's @esbuild/win32-x64), and this sandbox has no network egress
to `npm install` the linux-x64 equivalents; this is a pre-existing
environment gap, not something this session introduced — confirmed by
esbuild's own error naming @esbuild/win32-x64 as installed. Every
new/changed JSX file was instead syntax-checked with @babel/parser
(pure JS, platform-independent, already in node_modules) — all parse
cleanly. Same DB caveat as every session since Session 3 applies to the
new free_tool_links table/model/routes: code-reviewed and unit-
exercised via the auth-gate test only, never run against a real
Supabase/Postgres instance.

KNOWN BUGS: none known, with the same "not yet live-verified" caveat as
every other admin CRUD resource in this repo (see TODO.md/BUGS).

BLOCKERS: same standing sandbox blockers as every prior session (no
live Supabase/Postgres, no browser tool, no egress to ipapi.co or npm
registry) — none specific to this task beyond not being able to run a
real `vite build` (see Tests above).

NEXT EXACT TASK: run `npm run db:migrate` against a real Supabase
project to actually create the `free_tool_links` table, then
`npm run seed` to populate the 5 default rows, then exercise the new
admin tab by hand (create/edit/reorder/deactivate/delete a link,
confirm the public Footer picks up the change on reload) — this whole
feature is unverified against a live database, same as everything else
flagged in TODO.md/BUGS. Also worth running an actual `npm install` +
`vite build` on a real Linux machine/CI to confirm the client compiles
(this session could only syntax-check, not fully build/typecheck).

FILES TO INSPECT: server/src/models/FreeToolLink.js and
server/src/seed/seed.js (the delete-then-recreate seed step will wipe
any hand-entered links on every `npm run seed` run — same trade-off
SERVICES already makes, but worth the next agent/user knowing before
running seed against a project with real admin-entered links).

IMPORTANT NOTES: `href` deliberately accepts any non-empty string, not
just a URL — every seeded default currently points at the single
`/tools` page (which has its own in-page tabs for each individual
tool), but an admin could point a new link at a different internal
route or an external URL, and both render correctly now that
Footer.jsx's LinkColumn branches on `https?://`.

DO NOT REDO: everything from prior sessions, plus this session's
free_tool_links table/model/controller/routes/validators, the
FreeToolsTab admin UI, and Footer.jsx's fetch-with-fallback — extend,
don't revert Footer.jsx to a hardcoded array.

NEXT AGENT ACTION: if/when a real Supabase project is available, run
db:migrate + seed and hand-verify this feature end to end (see Next
Exact Task). Otherwise proceed to whatever the user asks next.
