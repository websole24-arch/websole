# Decisions

## Decision: MERN stack
Date: Session 1
Decision: Node/Express/MongoDB/React, per the brief's own fallback rule
for "MARN".
Alternatives considered: none — brief specified the fallback explicitly.

## Decision: JWT in an httpOnly cookie, not localStorage
Date: Session 1
Decision: auth token is set as an httpOnly, SameSite=Lax cookie.
Reason: reduces exposure to XSS-based token theft vs localStorage.
Impact: requires CORS with `credentials: true` and a CSRF mitigation plan
(currently SameSite + strict origin allow-list; full CSRF token deferred).

## Decision: single ServiceDetail component for 5 SEO routes
Date: Session 1
Decision: one component parameterized by slug, mapped to the 5 explicit
routes from the brief, instead of 5 duplicate page components.
Reason: keeps the 5 required SEO-friendly URLs without duplicating code.

## Decision: Stripe assumed as default payment provider
Date: Session 1
Decision: Payment model's `provider` enum defaults to `stripe`; no
integration built yet this session.
Reason: most common choice, supports webhooks, broad country coverage.
Alternatives: PayPal, regional providers — can be added since the model
already supports multiple provider values.

## Decision: per-country pricing rows, not currency conversion
Date: Session 1
Decision: CountryPricing stores explicit country/currency/price rows with
an "International" fallback tier, matching the brief's explicit warning
against blind currency conversion.

## Decision: no automatic IP geolocation yet
Date: Session 1
Decision: country selection is manual only this session, defaulting to
International.
Reason: automatic detection needs a geolocation service/API key that
wasn't available; brief also requires manual override to exist regardless.

## Decision: CSR-only React (Vite), not SSR
Date: Session 1
Decision: plain client-side rendered React for velocity.
Impact: real SEO limitation for a brief that emphasizes SEO — flagged in
ARCHITECTURE.md and TODO.md as a candidate for SSR/prerender later.

## Decision: new Project starts at "Awaiting Payment", not "Inquiry"
Date: Session 2
Decision: POST /api/projects computes the quote immediately (pricing row
found -> totalAmount/advanceAmount set), so the project is created
already at `Awaiting Payment` rather than `Inquiry`.
Reason: `Inquiry` fits the pre-quote /api/inquiries flow; once a customer
picks a specific service+package+country and a price is resolved, the
next real state is waiting on the 50% advance.
Alternatives considered: default to `Inquiry` and require a separate
admin action to move to `Awaiting Payment` — rejected as extra friction
for no real benefit here.

## Decision: IDOR check returns 403, not 404
Date: Session 2
Decision: GET /api/projects/:id returns 403 (not 404) when a non-admin
requests a project they don't own.
Reason: matches the existing `authorize()` middleware's error style
("Not authorized for this action") used elsewhere in this codebase.
Alternatives considered: 404 to avoid confirming a project ID exists —
reasonable, but inconsistent with the rest of the API; can revisit if a
stricter enumeration-resistance requirement comes up.

## Decision: vite bumped 5.2 -> 6.4.3
Date: Session 2
Decision: upgraded vite from ^5.2.0 to ^6.4.3 (major bump) instead of
deferring, as previously planned.
Reason: `npm audit` on a real machine surfaced a high-severity advisory
(GHSA-fx2h-pf6j-xcff, `server.fs.deny` bypass on Windows) alongside the
already-known moderate esbuild issue. Windows is a real dev target here,
so this wasn't safe to leave deferred. 6.4.3 is within
@vitejs/plugin-react's supported peer range (`^6.0.0`); build and dev
server verified working after the bump.
Alternatives considered: pin to a patched 5.x — none exists, the fixes
landed in 6.x. `npm audit fix --force` (jumps to vite 8) — skipped for
now to keep the version change minimal; revisit later.
Impact: package-lock.json regenerated. No app code changes required.

## Decision: Supabase Auth, kept behind the same REST API (backend-for-frontend)
Date: Session 4
Decision: replaced custom JWT + bcrypt with Supabase Auth
(`auth.admin.createUser`, `auth.signInWithPassword`,
`auth.admin.signOut`, `auth.refreshSession`). The client still only
talks to this app's own /api/auth/* routes — it does not call Supabase
directly, and does not get Supabase's raw access/refresh tokens in
JS-readable storage.
Reason: this was the explicit scope for this session (see the scope
question asked and answered). Keeping the client on our own REST API
rather than switching it to client-side supabase-js preserves the
httpOnly-cookie session model from Sessions 1-3 (meaningful XSS
protection the master prompt calls for) and meant zero client code
changes were needed for this migration.
Alternatives considered: client-side Supabase Auth (supabase-js in the
browser, PKCE/implicit flow) — the more common Supabase pattern, but it
puts tokens in browser-accessible storage by default and would have
required rewriting AuthContext.jsx and every protected-route check.
Rejected for this pass; could revisit if this app ever needs
client-side realtime/Storage features that assume a Supabase session in
the browser.
Impact: server/src/lib/supabase.js (admin client), server/src/utils/
supabaseJwt.js (local token verification), server/src/utils/
sessionCookies.js (cookie helpers), authController.js, middleware/
auth.js all rewritten. `users` table: dropped `password`,
`login_attempts`, `lock_until`; `id` now FKs to `auth.users(id)`
instead of generating its own. bcryptjs dependency removed; jsonwebtoken
kept (verification only, not signing).

## Decision: DATABASE_URL must use the Session pooler, not the direct connection
Date: Session 4 (post-handoff, real-world testing)
Decision: server/.env.example now points people at Supabase's "Session
pooler" connection string, not "Direct connection".
Reason: found by the project owner actually running `npm run seed`
against a real Supabase project — it failed with `ENOTFOUND
db.[ref].supabase.co`. Supabase's direct-connection hostname is
IPv6-only; most home and Windows networks don't have working IPv6 and
can't resolve it. The Session pooler hostname
(aws-0-[region].pooler.supabase.com) is IPv4-reachable and was already
the connection this app's design assumed (see the earlier pooler-mode
decision) — .env.example just had the wrong example string.
Impact: no code change, .env.example guidance only.

## Decision: verify Supabase access tokens locally, not via getUser()
Date: Session 4
Decision: `protect` middleware verifies the Supabase-issued JWT locally
with `jsonwebtoken` + the project's legacy shared secret
(SUPABASE_JWT_SECRET), rather than calling `supabase.auth.getUser()`
(a network round trip to Supabase on every authenticated request).
Reason: matches the performance characteristics of the original
custom-JWT middleware (no per-request network dependency on Supabase's
Auth API); also made this piece fully testable in this sandbox without
network access (server/tests/unit/supabaseJwt.test.js,
server/tests/integration/projects-db.test.js both mint locally-signed
tokens and verify the middleware accepts them).
Alternatives considered: `getUser()` network verification — the
Supabase-recommended default, more correct in one respect (also
catches server-side session revocation between token refreshes,
which local verification can't see until the token naturally expires)
but adds latency and an external dependency to every request, and
requires accepting a much narrower testing surface for a modification I
couldn't run against a live Supabase project this session.
Impact: if a Supabase project has the legacy JWT secret disabled
(newer projects can be configured to sign with an asymmetric key
instead), this stops working — see supabaseJwt.js and TODO.md. Session
revocation via `auth.admin.signOut()` won't take effect until the
already-issued access token naturally expires (up to its lifetime,
Supabase default ~1hr) — a real, accepted tradeoff of the local-verify
approach.

## Decision: register-time infra failures return 502, not 400
Date: Session 4
Decision: when `auth.admin.createUser` fails with no `.status` on the
returned error (i.e. Supabase itself is unreachable — DNS, timeout,
network), the register endpoint returns 502 with a generic message,
not a 400 with the raw SDK error text.
Reason: found by actually testing the failure path — register against
a syntactically-valid but unreachable SUPABASE_URL returned "400: fetch
failed" before this fix. A network failure isn't the client's fault
(400 implies bad input) and "fetch failed" isn't something a user
should see. Genuine Supabase Auth API errors (duplicate email, weak
password) do carry a `.status` and still pass straight through
unchanged — this only affects the "Supabase itself was unreachable"
case. Locked in with regression tests in
tests/unit/authController.test.js.

## Decision: MongoDB -> Supabase Postgres, custom auth kept (superseded)
Date: Session 3 — auth portion superseded by Session 4, see above; the
Postgres/no-ORM decision below still stands.
Decision: replaced MongoDB/Mongoose with Supabase-hosted Postgres,
accessed via plain `pg` (no ORM). Custom JWT + bcrypt auth is unchanged
— did not switch to Supabase Auth, Storage, or RLS.
Reason: requested by the project owner, scoped explicitly to "database
only" (see the scope question asked and answered this session) to avoid
also rewriting the auth system and every ownership check as an RLS
policy in the same change.
Alternatives considered: Prisma or another ORM — rejected for this pass
to avoid a native-binary postinstall step (`prisma generate` downloads a
query-engine binary) that isn't guaranteed to work in every build
environment; plain `pg` has no such dependency. Supabase Auth (full
migration) — deferred; would replace JWT/bcrypt entirely and change the
authorization model to RLS, a bigger change than "swap the database."
Impact: every model file, every controller, `middleware/auth.js`,
`config/db.js`, `app.js` (dropped `express-mongo-sanitize`, which was
Mongo-specific), `seed.js`, and both `_id`-using client pages
(Pricing.jsx, customer/Dashboard.jsx — now use `.id`) were rewritten.
New: server/src/db/schema.sql, server/src/db/pool.js,
server/src/db/migrate.js (`npm run db:migrate`).

## Decision: minimal SQL-file migration tool, not a migration framework
Date: Session 3
Decision: schema changes are one hand-written `schema.sql` (idempotent:
`create table if not exists`, `drop trigger if exists` + recreate) run
by a small script, not node-pg-migrate/Prisma Migrate/etc.
Reason: this is a from-scratch schema with no production data yet —
a full migration framework's value (versioned up/down migrations against
existing data) doesn't apply yet. Keeps the dependency list small.
Alternatives considered: node-pg-migrate — pure JS, no binary download,
genuinely a good fit; worth adopting once there's real data and schema
changes need to preserve it rather than just re-running `create table if
not exists`. Tracked in TODO.md/TECHNICAL DEBT.
Impact: `npm run db:migrate` is safe to re-run but does not know how to
alter an existing column or migrate existing rows — schema changes to
tables that already have data will need hand-written SQL until this is
revisited.

## Decision: Postgres NUMERIC parsed as JS number, globally
Date: Session 3
Decision: server/src/db/pool.js sets a global `pg` type parser for oid
1700 (NUMERIC) to `parseFloat`.
Reason: `pg` returns NUMERIC as a string by default (to avoid float
precision loss at large magnitudes). Every price/amount field in this
app is a normal-magnitude money value, and callers — controllers doing
arithmetic, the client calling `.toLocaleString()` — expect a JS number,
matching the old Mongoose `Number` fields. Found by actually running the
Projects flow against a live Postgres instance this session; without
this, `totalAmount` etc. come back as `"150"` (string) and
`.toLocaleString()` throws in the client.
Alternatives considered: cast to number in each model's row-mapping
function individually — more verbose, easy to miss one; a global parser
covers every table at once.

## Decision: DB-independent tests only this session
Date: Session 1
Decision: unit tests (password, token) and integration tests that don't
require a live database (health check, validation failures). No MongoDB
was available in this environment.
Impact: DB-dependent flows (full register/login, CRUD, IDOR checks) are
untested — see TEST_STATUS.md and TODO.md.

## Decision: admin "all rows" endpoints alongside the public ones, not a query param
Date: Session 5
Decision: added GET /api/services/admin/all, /api/packages/admin/all,
/api/pricing/admin/all as separate admin-only routes, rather than adding
an `?includeInactive=true` param to the existing public GET routes.
Reason: the public routes are unauthenticated; a query param toggling
visibility of inactive/unpublished rows on an open endpoint is an easy
way to accidentally leak "hidden" data if the auth check is ever
missed or misconfigured. A separate route makes the admin-only-ness
structural (protect + authorize('admin') on the route itself) rather
than conditional on a param being absent.
Alternatives considered: query param on the existing routes (rejected,
see above); a generic `/api/admin/*` prefix for all admin reads
(rejected as a bigger refactor than this session needed — nothing
stops that consolidation later, see TODO.md).

## Decision: PATCH /api/users/:id only edits isActive and role
Date: Session 5
Decision: the new admin user-management endpoint deliberately rejects
any body field other than `isActive`/`role` — no admin-side edit of a
customer's name, email, phone, or country.
Reason: matches the brief's actual ask (admin can "disable accounts when
necessary" — master prompt section 10) without building a broader
admin-edits-customer-PII surface that wasn't requested and adds more
audit-trail/consent questions than this session should decide alone.
isActive is also not cosmetic: `protect` middleware already rejects
inactive accounts (server/src/middleware/auth.js) — this endpoint
completes a control that was already half-built. An admin cannot
disable or demote their own account (checked server-side).
Impact: broader admin profile editing is out of scope until a future
session — see TODO.md.

## Decision: design token refresh keeps `jade`/`brass` as state colour, not page accent
Date: Session 5
Decision: replaced the site's primary accent with a new `signal` token
(cobalt blue) across Home, shared Navbar/Footer, and the new admin
dashboard; swapped every other page's `bg-jade`/`text-jade`/etc. usage
to `signal` too, but did not rename or restyle those pages further.
`jade` and `brass` still exist as tokens, now used only for status
colour (an "Active"/"Disabled" pill, a project-status badge).
Reason: a full page-by-page redesign wasn't this session's ask, and
touching every page's layout risked breaking things that weren't asked
for. Swapping the accent colour token is a small, mechanical,
low-risk change that still makes the whole site read as one consistent
palette instead of half blue / half green.
Alternatives considered: leave old pages on the green `jade` accent
(rejected — visibly inconsistent with the new Home/Navbar); redesign
every page this session (rejected as out of scope — see TODO.md).

## Decision: no icon library added
Date: Session 5
Decision: client/src/components/common/ServiceIcon.jsx is five
hand-written inline SVGs, not lucide-react or a similar package.
Reason: five icons doesn't justify a new dependency; keeps the bundle
and the dependency surface smaller.
Impact: adding more icons later means drawing more inline SVGs (or
revisiting this decision and adding a library) — noted in case a much
larger icon need shows up.

## Decision: ipapi.co for client-side IP geolocation, no key, defensive by design
Date: Session 6
Decision: client/src/utils/geolocateCountry.js calls
`https://ipapi.co/json/` directly from the browser (not proxied
through this app's backend), with a 4s timeout and a try/catch that
always resolves to `null` on any failure rather than throwing.
Reason: no API key needed for basic lookups, HTTPS, and it's called
from the visitor's own browser so it sees their real IP — proxying
through the backend would see this app's server IP instead, which is
useless for this purpose. Timeout + never-throw so a slow, blocked, or
rate-limited geolocation call can never break the page — it just
degrades to the pre-existing "International" default.
Alternatives considered: browser Geolocation API (rejected — needs a
permission prompt, gives coordinates not a country, needs a second
reverse-geocoding call); ip-api.com (rejected — free tier is HTTP-only,
would be mixed-content-blocked on an HTTPS site); a paid/key-based
provider (rejected — unnecessary for this use case, adds a secret to
manage for a "nice default" feature that's supposed to always have a
working fallback anyway).
Impact: not verified live — see TODO.md/BUGS and the comments in
geolocateCountry.js. Swapping providers later should only require
editing that one file.

## Decision: auto-detected country never overrides an explicit manual choice, and doesn't persist on its own
Date: Session 6
Decision: CountryContext only attempts IP-based detection when
localStorage has no prior `selectedCountry` value. A manual choice
(via CountrySelector) always wins from then on and is what gets
persisted. An auto-detected result is used for the current session but
NOT written to localStorage — so a visitor who's never explicitly
chosen a country gets a fresh detection attempt on their next visit
too, rather than a stale one “locking in” silently.
Reason: matches the brief directly — "Allow the customer to manually
change their country... Clearly display the selected country and
currency... Do not hide pricing logic from the customer." Persisting
an auto-detected value indistinguishably from a manual one would make
it harder to tell, later, whether "why is this LKR?" was ever an
active choice.
Impact: the CountrySelector shows a small dot + tooltip when the
current value is auto-detected rather than chosen, and the hero price
card's footer text says so explicitly.

## Decision: no animation library added; hand-rolled hooks instead
Date: Session 6
Decision: motion (scroll-triggered 3D reveal, pointer-tilt on cards)
is two small hooks (client/src/hooks/useScrollReveal.js,
useTilt.js) plus a couple of CSS classes in index.css — not
framer-motion or a similar package.
Reason: same reasoning as the icon-library decision (DECISIONS.md
above) — the actual need (an entrance animation and a hover tilt) is
small enough that a dependency isn't justified, and it keeps the
bundle smaller. Both hooks respect prefers-reduced-motion through the
existing global transition-duration override already in index.css, and
useScrollReveal falls back to revealing immediately if
IntersectionObserver isn't available, so nothing can get permanently
stuck invisible.
Alternatives considered: framer-motion (rejected — real dependency
weight for what two small hooks cover); a WebGL/three.js 3D scene
(rejected — the request read as "give scrolling some 3D depth," which
CSS 3D transforms (perspective/rotateX/rotateY) handle without a
rendering-engine dependency; three.js would be the right call for an
actual 3D scene, not for card-tilt-style motion).

## Decision: reviews start unapproved, admin-moderated, no seed data
Date: Session 7
Decision: new `reviews` table/feature — any logged-in user can submit one
review (rating 1-5 + comment, optional free-text `service`); it's stored
with `approved: false` and only shows on the public Home page once an
admin approves it from the new admin "Reviews" tab. `name`/`country` are
copied server-side from the submitter's own profile, never taken from the
request body, so a review can't be posted under a spoofed identity.
Reason: matches this project's existing "no fabricated testimonials"
stance (see the Session 5 value-props decision above, which explicitly
avoided invented client counts/testimonials) — moderation keeps the
public list honest and spam/abuse-resistant without adding a full
comment-reporting system.
Alternatives considered: auto-publish on submit — rejected, no spam/abuse
gate; one review per project instead of one per user — rejected as
unnecessary complexity for this pass, revisit if multi-project customers
ask to review each project separately.
Impact: server/src/db/schema.sql (new `reviews` table), models/Review.js,
controllers/reviewController.js, validators/reviewValidators.js,
routes/reviewRoutes.js. Client: components/common/StarRating.jsx,
components/home/Reviews.jsx (Home page section), a review form on
customer/Dashboard.jsx, and pages/admin/tabs/ReviewsTab.jsx (approve /
unpublish / delete) wired into AdminDashboard.jsx.

## Decision: client-side field validation added on top of existing server validation
Date: Session 7
Decision: Login, Register, and Contact forms now validate per-field on
blur/change and block submission with inline messages
(client/src/utils/validators.js, components/common/FieldError.jsx),
mirroring the server-side express-validator rules rather than replacing
them. Also added a real server-side validator for the contact/inquiry
form (server/src/validators/inquiryValidators.js) — previously that
route only had an ad hoc `if (!name || ...)` check in the controller,
unlike auth's routes which already used express-validator.
Reason: the client-side layer is pure UX (fewer round trips for obvious
mistakes); the server remains the source of truth and re-validates
everything regardless of what the client already checked.
Impact: client/src/pages/Login.jsx, Register.jsx, Contact.jsx rewritten;
server/src/routes/inquiryRoutes.js now runs createInquiryValidator +
validate before createInquiry; controllers/inquiryController.js's manual
guard removed since the route-level validator now covers it.

## Decision: removed manual country selector — pricing is now fully automatic, two-tier only
Date: Session 8
Decision: the "pick your country" dropdown (Navbar, and the "Try it — see
your rate" widget on Home) is removed entirely. There is no manual
country override any more. CountryContext now auto-detects via IP on
load and resolves to exactly one of two values — "Sri Lanka" if the
detected country matches, "International" for everyone else (including
detection failure/timeout) — and that's the only input to pricing.
`RateCompare` (the "Real rates, not converted ones" section on Home) now
compares just those two tiers instead of every country with a pricing
row, since that's the only comparison a visitor can actually land in now.
Reason: explicit request to remove the location-select UI and make
country resolution strictly "Sri Lanka vs everyone else," rather than a
customer-editable field.
Impact: client/src/context/CountryContext.jsx rewritten (no more
`setCountry`/`countries`/`autoDetected` — just `country` and `detecting`,
plus exported `SRI_LANKA`/`INTERNATIONAL` constants); deleted
components/common/CountrySelector.jsx; Navbar.jsx no longer renders it
(desktop or mobile); PriceExplorer.jsx's dropdown replaced with a static
badge; RateCompare.jsx compares the two constants instead of a fetched
country list; Home.jsx's stat row and "why country pricing" copy updated
to reflect two tiers instead of an N-country count.
Note: this only touches the *pricing* country signal. The Register/Contact
"which country are you actually in" field (added Session 7) is unrelated
and still offers the full world-country list — that's about recording
who the customer is, not which price tier they see. Admin pricing
management (country_pricing table/CRUD) is also untouched — an admin can
still add other countries' rows in the database if needed later; the
frontend just never surfaces more than Sri Lanka/International to a
visitor while the model stays binary.

## Decision: replaced "Real rates, not converted ones" with a Recent Projects section
Date: Session 9
Decision: removed the Home page's rate-comparison section (Sri
Lanka-vs-International price cards) entirely, along with its now-unused
RateCompare.jsx component. In its place, Home shows a new "Recent
projects" section — real, admin-published work only, via a new
`portfolio_projects` table/model/routes (admin-only create/edit/publish/
delete; public GET returns published rows only). The existing Portfolio
page, previously a static placeholder ("add real project examples here
once available... avoid publishing invented client names or results"),
now renders the same published list in full instead of empty dashed
boxes.
Reason: explicit request to remove the rate-comparison section and add a
recent-projects section. Kept the moderation/publish pattern consistent
with Reviews (Session 7) rather than pulling from the private `projects`
table, which holds real customers' in-progress status/amounts — not
public data, and never intended for public display.
Impact: server/src/db/schema.sql (new `portfolio_projects` table),
models/PortfolioProject.js, controllers/portfolioController.js,
validators/portfolioValidators.js, routes/portfolioRoutes.js (mounted at
/api/portfolio). Client: components/home/RecentProjects.jsx (new, shown
on Home), pages/Portfolio.jsx (rewritten to fetch real data), deleted
components/home/RateCompare.jsx, and pages/admin/tabs/PortfolioTab.jsx
(new admin tab: create/edit/publish/unpublish/delete) wired into
AdminDashboard.jsx.
Note: there's still no image upload — the admin form takes an image URL
(paste a hosted link) rather than a file, consistent with there being no
file-storage infra elsewhere in this project. If that image is missing,
cards fall back to a plain gradient block rather than a broken-image icon.

## Decision: business location map + contact details on the Contact page
Date: Session 10
Decision: Contact page is now a two-column layout — the inquiry form on
the left, a "Contact details" card (address/email/phone/hours) and a
Google Map of the business location on the right. Both are driven by new
env vars (VITE_BUSINESS_EMAIL, VITE_BUSINESS_PHONE, VITE_BUSINESS_ADDRESS,
VITE_BUSINESS_MAP_QUERY, VITE_BUSINESS_HOURS) rather than hardcoded —
this project has no real business's actual address, so hardcoding one
would be fabricated data (same reasoning as the existing "no invented
client names/testimonials" stance). Each detail row only renders if its
env var is set, and the map shows a clear "set VITE_BUSINESS_ADDRESS..."
placeholder instead of a blank/broken embed when unconfigured.
Map implementation: keyless `google.com/maps?q=...&output=embed` iframe
rather than the official Maps Embed API, since that requires a Google
Cloud API key/billing setup this project doesn't have. Trade-off: this
endpoint is undocumented/unofficial (works reliably in practice, but
isn't an SLA'd Google product) — swap to the real Embed API + key later
if that matters.
Impact: client/src/components/common/BusinessMap.jsx (new),
BusinessContactCard.jsx (new), Icon.jsx (added MailIcon, PhoneIcon,
ClockIcon), pages/Contact.jsx restructured into a two-column grid,
client/.env.example documents the new vars.

## Decision: email verification via Supabase's own confirmation-link flow
Date: Session 11
Decision: register() now creates the auth user with `email_confirm:
false` and explicitly calls `supabase.auth.resend({ type: 'signup' })` to
trigger Supabase's built-in confirmation email (admin.createUser never
sends one itself, regardless of email_confirm). No session is issued at
registration anymore. The client's new /auth/callback route reads the
access_token/refresh_token Supabase appends to the confirmation-link
redirect and posts them to the new POST /auth/verify, which re-verifies
the token against Supabase (auth.getUser), flips users.email_verified,
and only then sets the real session cookies. login() now maps Supabase's
`email_not_confirmed` error to a distinct 403 so the client can offer
"resend" instead of a generic "wrong password". Applies uniformly to
customer and admin accounts — both go through the same /auth/login and
the new /auth/verify; there's no separate admin-only path.
Reason: this was the explicitly deferred TODO item ("email verification
flow"); users.email_verified already existed in schema.sql but was never
actually set anywhere until now.
Alternatives considered: `admin.generateLink` — rejected, it only
generates a link, it doesn't send an email, so this app would need to
own email delivery itself. Switching register() to the public `signUp()`
method instead of `admin.createUser` — rejected to keep the existing
atomic create-user-then-create-profile-with-rollback shape intact.
Impact: server/src/controllers/authController.js (register/login
rewritten, new verifyEmail + resendVerification), new POST
/auth/verify + POST /auth/resend-verification routes/validators,
User.update now accepts emailVerified (admin route still only exposes
isActive/role — unchanged). Client: register() no longer returns a
signed-in user (Register.jsx shows a "check your email" state instead
of navigating to /dashboard), new client/src/pages/VerifyCallback.jsx at
/auth/callback, Login.jsx and AdminLogin.jsx both get a "resend
verification email" action on the new 403 case. Seed data
(seed.js) already used `email_confirm: true` / `emailVerified: true`
for demo/admin accounts and is unaffected.
Not done: no rate limit specifically on resend beyond the shared
authLimiter; no UI-visible distinction if Supabase's redirect uses
`?code=` instead of a `#access_token=` fragment (would mean PKCE is
enabled for email links on that Supabase project) — flagged in TODO.md
for hands-on verification against a real project.

## Decision: protect middleware falls back to a live Supabase check on local-verify failure
Date: Session 12
Decision: middleware/auth.js's resolveUser() now calls
`supabase.auth.getUser(accessToken)` whenever local HS256 verification
fails for a reason other than expiry, instead of immediately treating
the token as invalid and clearing the session cookies.
Reason: caught live, not hypothetically — server logs against the real
Supabase project showed `POST /api/auth/login 200` (slow, real network
round trip) immediately followed by every subsequent request 401ing
"Not authenticated", cookies wiped, even though the user had just
logged in successfully. Root cause: this Supabase project signs access
tokens with an asymmetric key rather than exposing the legacy shared
secret, so `jsonwebtoken.verify(token, SUPABASE_JWT_SECRET, {algorithms:
['HS256']})` throws for every token, valid or not — TODO.md had already
flagged this exact possibility before it was confirmed live.
Impact: server/src/middleware/auth.js (new verifyViaSupabaseNetwork,
resolveUser's catch branch). server/src/utils/supabaseJwt.js's comment
updated to point at the fallback instead of describing it as an open
question. New tests/unit/authMiddleware.test.js (3 tests): a token that
fails local verification but Supabase confirms is still accepted;
a token both reject is still treated as logged-out (cookies cleared);
a validly HS256-signed token never touches the network at all,
confirming the fast path is unchanged when the shared secret does
match.
Trade-off: on a project where the shared secret never matches, this
makes every authenticated request pay a Supabase network round trip
instead of the intended local-verify fast path — correctness over the
optimization for now; flagged in TODO.md as worth revisiting (fix the
secret so the fast path applies, or cache verified tokens) if that
latency matters in practice.

## Decision: reviews gated on having a Completed project
Date: Session 13
Decision: the customer dashboard's review form now only renders once
the customer has at least one project with status exactly 'Completed'
(client/src/pages/customer/Dashboard.jsx). POST /api/reviews enforces
the same rule server-side (new Project.hasCompletedProject, checked in
reviewController.createReview before Review.create, 403 if not met) —
the client-side hide is a UI nicety, not the actual gate, since the
endpoint is reachable directly regardless of what the dashboard shows.
Reason: reported live — the dashboard was showing the review form for
a project still at 'Payment Confirmed', before any work was actually
delivered.
Alternatives considered: also allow status 'Closed' — rejected, since
'Closed' can mean a project was abandoned/cancelled before delivery,
not just wrapped up successfully; soliciting a review in that case
doesn't make sense. Scoping eligibility per-project (only reviewable if
*that specific* project is Completed) instead of per-customer (any one
Completed project unlocks the single review slot) — rejected to keep
the existing one-review-per-account model (Review.findByUser is already
a single row, not a list) rather than redesigning reviews into a
per-project structure this session.
Impact: server/src/models/Project.js (new hasCompletedProject),
server/src/controllers/reviewController.js (createReview now checks
it), client/src/pages/customer/Dashboard.jsx (ReviewSection only
rendered when `projects.some(p => p.status === 'Completed')`). New
tests/unit/reviewController.test.js (3 tests: blocked pre-completion,
allowed post-completion, duplicate-review check still short-circuits
before the eligibility check).

## Decision: Stripe Checkout (hosted redirect), not Stripe Elements
Date: Session 14
Decision: payments go through a Stripe Checkout Session
(`stripe.checkout.sessions.create`, `mode: 'payment'`) and a browser
redirect to Stripe's own hosted page, not Stripe Elements embedded in
this app's UI.
Reason: no PCI scope, no publishable key or Stripe.js needed
client-side at all, and it's the lower-effort integration for a service
business taking two payments (50% advance, then the remainder) rather
than a high-volume checkout flow where a custom-styled in-page form
would matter more.
Alternatives considered: Stripe Elements — rejected for now (more
client-side code, PCI SAQ A-EP instead of A, no clear benefit here);
Stripe Payment Links (no code at all) — rejected because this app needs
the session tied to a specific project/type via metadata and a webhook
to update that project's status automatically, which Payment Links
doesn't support as directly.

## Decision: webhook is the source of truth; a /verify endpoint is the fallback, not a replacement
Date: Session 14
Decision: `POST /api/payments/webhook` is what actually marks a payment
Paid in normal operation. `GET /api/payments/verify/:sessionId` exists
alongside it, called by the client once on redirect-back from Stripe,
and applies the exact same idempotent logic
(`paymentController.applyPaidPayment`) by re-checking the session
directly with Stripe.
Reason: local dev has no public URL for Stripe to call, so without this
fallback the dashboard would show a stale "Awaiting Payment" status
indefinitely unless `stripe listen` happens to be running. Since both
paths funnel through the same idempotent function, calling `/verify`
after the webhook already landed is a safe no-op, not a race condition
to worry about.
Impact: server/src/controllers/paymentController.js (applyPaidPayment
shared by handleWebhook and verifySession).

## Decision: payment gate is a single explicit status check, not a state machine
Date: Session 14
Decision: `PATCH /api/projects/:id/status` blocks exactly one
transition — setting status to `'Project Started'` — unless
`Payment.hasPaidAdvance` is true for that project. No other status
value is gated, and nothing stops an admin from setting a *different*
status (e.g. jumping straight to `'Development'`) without ever passing
through `'Project Started'`.
Reason: matches the brief's stated rule ("50% payment... gate before
Project Started") exactly, without inventing a broader sequential
state-machine this app doesn't otherwise have — `STATUSES` has always
been treated as a flat enum, not an ordered workflow with enforced
transitions, and expanding that scope wasn't asked for.
Alternatives considered: gating every status at or after 'Project
Started' in the STATUSES array — rejected as scope creep; an admin
skipping 'Project Started' entirely is an existing, pre-existing gap in
how loosely STATUSES was designed, not something this session's payment
work should silently fix as a side effect.
Impact: server/src/controllers/projectController.js
(updateProjectStatus), tests/integration/payments-db.test.js.

## Decision: file uploads use a declared-MIME allowlist, not content sniffing
Date: Session 14
Decision: `fileController.js`'s multer `fileFilter` checks
`file.mimetype` (the browser-declared Content-Type) against a fixed
allowlist, plus a 25MB size cap. It does not inspect the file's actual
bytes.
Reason: every uploader is an authenticated project owner or admin
(enforced by `loadProjectOrThrow`), not the public — the threat model
here is "wrong file type by mistake," not "adversarial upload trying to
disguise an executable," which is a meaningfully smaller problem this
session's time budget covers. True sniffing (e.g. the `file-type`
package) or AV scanning is flagged as a prerequisite in TODO.md/SECURITY
if this ever accepts uploads from a less-trusted source.
Impact: server/src/controllers/fileController.js.

## Decision: downloads via short-lived signed URLs, not a proxy stream
Date: Session 14
Decision: `GET /api/projects/:id/files/:fileId/download` returns a
Supabase Storage signed URL (60s expiry) as JSON for the client to
open directly, rather than this server fetching the file from Storage
and streaming the bytes back through itself.
Reason: the ownership/auth check that matters (project owner or admin)
already happened before the signed URL is minted — proxying the bytes
through Node afterward would add a full request's worth of memory and
bandwidth for no additional security, since the URL itself is
short-lived and unguessable.
Impact: server/src/controllers/fileController.js.

## Decision: SameSite flips to None only in production, not unconditionally
Date: Session 14
Decision: `sessionCookies.js`'s SameSite policy is `NODE_ENV ===
'production' ? 'none' : 'lax'`, not a hardcoded `'none'`.
Reason: `SameSite=None` requires `Secure`, and browsers refuse to
*store* a Secure cookie set over plain HTTP — so hardcoding `'none'`
would silently break login in local dev (http://localhost). Tying it to
NODE_ENV means the switch happens automatically for the chosen
production shape (HTTPS on both Vercel and Railway/Render) without a
separate env var to remember to set.
Impact: server/src/utils/sessionCookies.js. See ARCHITECTURE.md's
"Cross-domain production note" (originally written in an earlier
session flagging this as a needed fix, closed out here).

## Decision: Vercel + Railway configs committed, Render kept as a documented alternative
Date: Session 14
Decision: `client/vercel.json`, `server/railway.toml` are the primary
deploy configs (matching the target shape from PROJECT_STATUS.md /
README). `server/render.yaml` is included too, since Railway and Render
are effectively interchangeable Node hosts and the brief's own wording
allowed either.
Reason: no live deploy was possible from this sandbox either way (no
network access to vercel.com/railway.app APIs, and no credentials were
provided) — configs are written for a human to actually deploy with,
not verified by this session. See DEPLOYMENT.md.
