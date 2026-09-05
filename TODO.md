# TODO

## NOW
- Portfolio image upload (this session): create a `portfolio-images`
  bucket in Supabase Storage dashboard, set Public — required before
  admin > Portfolio > Upload will work. See
  server/src/controllers/portfolioController.js
- Verify Supabase Auth against the real project (not yet done — see
  TEST_STATUS.md): register -> confirm email link -> login -> logout ->
  token-expiry refresh, by hand, with real
  SUPABASE_URL/SERVICE_ROLE_KEY/JWT_SECRET
- Email verification (register -> resend() -> /auth/callback ->
  POST /auth/verify) is new this session and untested against a live
  Supabase project — confirm: the Auth -> URL Configuration -> Redirect
  URLs allow list includes {CLIENT_ORIGIN}/auth/callback, the confirmation
  link actually lands there with #access_token/#refresh_token (not
  ?code=, which would mean PKCE is on for email links and this needs a
  different exchange), and that resend() actually sends an email for a
  user created via admin.createUser (not just for signUp()-created ones)
- Confirmed live: SUPABASE_JWT_SECRET verification was failing for
  every request against the real project (login 200, then every
  following request 401 "Not authenticated", cookies wiped) — this
  project signs access tokens asymmetrically, so the legacy shared
  secret never matches. Fixed by adding the network fallback
  (`auth.getUser()`) this item used to just flag as a maybe — see
  server/src/middleware/auth.js's verifyViaSupabaseNetwork and
  DECISIONS.md. Every request now costs a network round trip instead of
  the intended local-verify fast path; worth either (a) getting
  SUPABASE_JWT_SECRET to actually match so the fast path is used, or
  (b) caching getUser() results for the token's remaining lifetime, if
  request latency here becomes a problem
- Re-run `npm run db:migrate` + `npm run seed` +
  `RUN_DB_TESTS=1 npx jest tests/integration/projects-db.test.js`
  against the actual Supabase project (verified against local Postgres
  only so far — see TEST_STATUS.md)
- Deploy: Vercel (client) + Railway/Render (server) configs are written
  (railway.toml, render.yaml, vercel.json, .env.production.example) but
  nothing has actually been deployed yet — see DEPLOYMENT.md for the
  step-by-step and its live-verification checklist

## NEXT
- Inquiries: no update/status endpoint yet — admin dashboard's Inquiries
  tab is read-only (list only). Add a way to mark one "converted" or
  turn it into a Project directly, instead of the admin manually
  recreating it under Projects.
- Admin profile editing for customers (name/email/phone/country) — the
  new PATCH /api/users/:id deliberately only covers isActive/role; a
  broader admin edit was out of scope this session (see DECISIONS.md)
- Design refresh (Session 5) only fully reached Home + shared
  Navbar/Footer + the new admin dashboard; inner pages (Login, Register,
  Contact, ServiceDetail, Services, Portfolio, About, Process, FAQ, the
  customer dashboard) only got a colour-token swap, not a full redesign
  pass — worth a follow-up if visual consistency across the whole site
  matters before launch
- No confirm/toast UI in the admin dashboard yet — destructive actions
  use `window.confirm`, and save errors show inline rather than as a
  toast; fine for now, revisit if it feels rough in practice
- Session 7 swapped the primary Navbar's Process link for Home
  (client/src/components/layout/Navbar.jsx); Footer.jsx still has its
  own `links` array with a Process entry (line 14) — confirm whether
  it should match

## LATER
- Notifications (in-app + email)
- MFA/2FA for admin accounts — Supabase Auth supports this natively now
  (TOTP), worth using instead of building it
- Dark/light mode
- Full SEO: meta/OG tags, schema markup, generated sitemap (consider SSR/prerender)
- Real copy for About/Process/FAQ/Portfolio
- Legal review of Terms/Privacy/Refund policy text (currently placeholder)

## BUGS
- None known. Two were found and fixed by actually running things this
  session and last: a 400-vs-502 error-mapping bug on register
  (DECISIONS.md), and two SQL column-alias bugs in Session 3
  (CountryPricing/Project models). Services/Packages/CountryPricing
  admin CRUD code hasn't been re-exercised live since the Postgres
  migration (Session 3) — still just code-reviewed. Same caveat now
  applies to everything added in Session 5 (the three admin/all list
  routes, GET/PATCH /api/users, and the admin dashboard UI that calls
  them) — no live Supabase instance was available this session either,
  so only the no-session 401 path is automated
  (tests/integration/admin.test.js). Exercise all of it by hand against
  a real Supabase project before trusting it.
- Session 6: IP-based country auto-detect
  (client/src/utils/geolocateCountry.js, calls ipapi.co) has never
  actually been exercised — the sandbox this was built in has no
  network egress to ipapi.co. Before trusting it: confirm the response
  shape is still `{ country_name, country_code, ... }` (ipapi.co could
  have changed it), confirm the free tier's rate limit is workable at
  real traffic, and confirm CORS/HTTPS behaves from an actual deployed
  origin. It's written defensively (timeout + try/catch, always
  resolves rather than throws) so a broken API degrades to the existing
  "International" default rather than breaking the page — but that
  degrade path itself should be watched for once real users hit it.

## SECURITY
- Full CSRF token (double-submit) implementation — currently relying on SameSite + CORS
- File uploads check declared Content-Type + a 25MB cap + a magic-byte
  sniff via `file-type` (Session 15) for formats it can fingerprint.
  Undetectable formats (plain text, CSV, JSON) still rely on declared
  Content-Type alone — acceptable since uploaders are always an
  authenticated project owner or admin, not the public. AV scanning is
  still not in place; add a scan step before accepting uploads from any
  less-trusted source.
- Structured production logging (Winston/Pino) beyond console/morgan
- Rate limiter uses in-memory store — needs a shared store (Redis) for multi-instance deploys
- Row Level Security (RLS) is NOT enabled on the Supabase tables — this
  app relies entirely on server-side checks (protect/authorize/isOwner)
  using the service_role key, which bypasses RLS regardless. Now that
  `public.users.id` == `auth.uid()`, meaningful RLS policies could
  actually be written if this app (or a future client-side feature)
  ever needs direct client-side Supabase access — mandatory before that
  happens, optional until then.
- Session revocation via logout only takes effect once the already-
  issued access token naturally expires (local JWT verification doesn't
  see server-side revocation before that) — see DECISIONS.md. Acceptable
  given short (~1hr) token lifetime, but worth knowing.

## PERFORMANCE
- Image optimization/lazy loading once real media exists
- CDN/caching strategy for production

## TECHNICAL DEBT
- ESLint/Prettier not configured
- No CI pipeline
- Migration tooling is one hand-written schema.sql + a runner script, not
  a real migration framework (no up/down, no history table) — fine for a
  from-scratch schema, needs node-pg-migrate or similar once there's real
  data to preserve across schema changes (see DECISIONS.md)
