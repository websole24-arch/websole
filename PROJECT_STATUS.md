# Project Status

Legend: [✓] done  [~] partial  [ ] not started  [!] blocked

Foundation                 [✓] monorepo, security middleware, error handling
Database                    [✓] MongoDB -> Supabase Postgres migration (see
                             DECISIONS.md); schema + pool + migrate script
                             verified against a real local Postgres, not
                             yet against Supabase itself
Authentication              [~] Supabase Auth (Session 4, see DECISIONS.md)
                             — register/login/logout/me rewritten; token
                             verification IS tested live (local Postgres +
                             locally-minted tokens), the actual Supabase
                             Auth API calls are mocked, not live-verified
                             (no network access to *.supabase.co in this
                             sandbox — see TEST_STATUS.md); email
                             verification not built into the app flow yet
Customer Registration       [~] rewritten for Supabase Auth, mocked-tested
                             only — see Authentication above
Customer Login               [~] rewritten for Supabase Auth, mocked-tested
                             only — see Authentication above
Admin Authentication         [~] same login path + role check; MFA not
                             built in (Supabase Auth supports TOTP
                             natively — see TODO.md)
Role-Based Authorization    [✓] protect + authorize middleware, applied to admin routes
Services                    [✓] public list/detail + admin CRUD; rewritten
                             for Postgres, not re-verified live since
                             (see TODO.md/BUGS)
Packages                    [✓] public list + admin CRUD; rewritten for
                             Postgres, not re-verified live since
Country Pricing             [✓] schema + public lookup + fallback + admin
                             CRUD; the lookup path IS verified live (used by
                             Project creation, see below) — admin CRUD isn't.
                             Country now auto-detected from IP on first
                             visit (Session 6, client-side, ipapi.co) with
                             manual override always winning — not verified
                             live, no network egress to ipapi.co in this
                             sandbox (see TODO.md/BUGS)
Currency                    [~] stored/displayed per pricing row; no live FX conversion (by design)
Customer Dashboard           [✓] shows real projects, verified against a real Postgres
Project Management           [✓] API done (create/list/get/status), IDOR +
                              role checks verified live against a real
                              Postgres, using locally-minted Supabase-
                              shaped tokens (protect middleware's real
                              verification path, not a stub)
50% Payment                  [✓] advance/remaining split calculated and
                              stored on project creation; Stripe Checkout
                              wired up (Session 14) and the advance is
                              enforced as a real gate before "Project
                              Started" — see Payment Verification
Payment Verification         [~] Stripe Checkout Session + webhook +
                              idempotent /verify fallback implemented and
                              unit-tested against a mocked Stripe SDK (no
                              network access to api.stripe.com in this
                              sandbox) — needs one real test-mode run
                              against live Stripe keys before trusting it
                              in production, see DEPLOYMENT.md
Admin Dashboard               [~] real tabbed UI now (Overview, Projects,
                               Customers, Services, Packages, Pricing,
                               Inquiries, Reviews, Portfolio, Free Tools)
                               wired to live endpoints — see
                               ARCHITECTURE.md. Not yet live-verified
                               against Supabase (see BUGS in TODO.md);
                               Projects tab now shows advance-paid status
                               and a file manager (Session 14); Inquiries
                               tab is read-only (no update endpoint
                               exists); no admin edit for customer
                               profile fields beyond isActive/role
Project Files                [✓] Supabase Storage upload/list/download/
                              delete (Session 14) — declared-MIME allowlist
                              + 25MB cap, not true content sniffing or AV
                              scanning (documented gap, see fileController.js)
File Authorization            [✓] owner-or-admin enforced on upload/list/
                              download; delete is admin-only; downloads go
                              through short-lived (60s) signed URLs, not
                              public bucket access
Google Form                  [~] frontend link + explicit messaging wired, needs real URL
WhatsApp                     [✓] button + prefilled message wired, needs real number
Notifications                [ ] model exists, no delivery
SEO                          [~] semantic structure + robots.txt/sitemap.xml stub; no meta/schema yet
Performance                  [ ] not evaluated
Security Audit               [ ] not performed
Production Deployment        [~] Vercel (client) + Railway/Render (server)
                              configs written (railway.toml, render.yaml,
                              vercel.json, .env.production.example x2),
                              cross-domain cookie fix applied
                              (SameSite=None in production — see
                              DEPLOYMENT.md) — not yet actually deployed
                              or live-verified from this sandbox
