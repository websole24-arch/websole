# International Web & Design Services Platform

Monorepo: `server/` (Express + Supabase Postgres + Supabase Auth API)
and `client/` (React + Vite).

## Status

This is Session 14 of a multi-session build. Read `AI_AGENT_HANDOFF.md` first —
it has the exact next task (note: that file was last updated at Session 5
and is stale on everything after — `PROJECT_STATUS.md`, `TODO.md`, and
`DECISIONS.md` are the accurate, continuously-updated record; treat
`AI_AGENT_HANDOFF.md`'s specifics as historical, not current). Also see
`PROJECT_STATUS.md`, `TODO.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and
`TEST_STATUS.md`. For deploying to Vercel + Railway/Render, see
`DEPLOYMENT.md`.

## Quick start

Requires Node 18+ and a Supabase project.

```
npm run install:all

cp server/.env.example server/.env      # fill in DATABASE_URL, SUPABASE_*, etc.
cp client/.env.example client/.env

npm run db:migrate                  # applies server/src/db/schema.sql
npm run seed                        # loads sample services, packages, and country pricing
npm run dev:server                  # http://localhost:5000
npm run dev:client                  # http://localhost:5173
```

`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
`SUPABASE_JWT_SECRET` all come from your Supabase project (Settings ->
Database / Settings -> API). See `server/.env.example` for details,
including the connection-pooler caveat for `DATABASE_URL`.

`npm run db:migrate` requires a real Supabase Postgres instance — the
schema assumes Supabase's own `auth.users` table already exists, which
a bare/local Postgres won't have.

To seed an admin user, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in
`server/.env` before running `npm run seed`.

## Structure

```
server/src/
  db/           schema.sql, pool.js (pg Pool), migrate.js (npm run db:migrate)
  lib/          supabase.js — Supabase Auth admin client
  models/       User (Supabase Auth profile), Service, Package,
                CountryPricing, Project, Payment, ProjectFile,
                Notification, ActivityLog, Inquiry, PortfolioProject,
                FreeToolLink — plain data-access modules over `pg`, not
                an ORM
  controllers/  auth, service, package, pricing, inquiry, project
  routes/       one file per resource, mounted in routes/index.js
  middleware/   auth (Supabase token verification + RBAC), rate
                limiting, error handling, validation
  seed/         seed.js — sample data + optional admin user

client/src/
  pages/        one file per route (see App.jsx for the route list)
  context/      AuthContext, CountryContext
  components/   layout/ (Navbar, Footer) and common/ (shared UI)
```

## What's built vs not

See `PROJECT_STATUS.md` for the full checklist. In short: foundation,
auth, services, packages, country pricing, inquiries, projects (create/
list/get/status, with a real Stripe-backed payment gate), Stripe
Checkout payments, Supabase Storage file uploads, and the admin
dashboard are implemented. Auth is Supabase Auth (see `DECISIONS.md`)
behind the same REST API the client always used. The Projects API
(including IDOR/role checks) and the payment gate are verified against
a real local Postgres; the actual Supabase Auth, Supabase Storage, and
Stripe API calls are mocked, not live-verified — this sandbox has no
network access to `*.supabase.co` or `api.stripe.com`. See
`TEST_STATUS.md` for exactly what ran and what still needs to run
against the real Supabase/Stripe accounts, and `DEPLOYMENT.md` for the
Vercel/Railway/Render deploy steps and a live-verification checklist.
Notifications are not built — scoped in `TODO.md`.

## Known limitations

- The database was MongoDB through Session 2 and is Supabase Postgres
  from Session 3 onward; auth was custom JWT/bcrypt through Session 3
  and is Supabase Auth from Session 4 onward (see `DECISIONS.md`). Both
  migrations were verified against a real local Postgres, not the
  project's actual Supabase instance — do that before trusting this in
  production (see `TEST_STATUS.md` for the exact steps).
- Supabase Auth token verification assumes your project exposes the
  legacy shared JWT secret. If it's configured for asymmetric signing
  only, that needs a code change first — see
  `server/src/utils/supabaseJwt.js`.
- Free-tier Supabase projects pause after ~1 week of inactivity. If
  `db:migrate`/`seed`/the app suddenly can't reach the database after
  time away, check the Supabase dashboard for a "paused" banner before
  assuming it's a connection-string problem — unpausing is one click.


done
