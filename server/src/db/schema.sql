-- Schema for Supabase Postgres. Run via `npm run db:migrate` (server/).
-- Idempotent: safe to re-run.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- users -----------------------------------------------------------------
-- Profile table for Supabase Auth. Credentials (password, sessions, rate
-- limiting/lockout) live in Supabase's own auth.users — this table only
-- holds app-specific fields, keyed 1:1 by the auth user's id.
-- auth.users is provisioned by Supabase itself; this migration does not
-- (and must not) create it.
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  country text,
  company_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  is_active boolean not null default true,
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at before update on users
  for each row execute function set_updated_at();

-- services ----------------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text not null,
  description text not null,
  examples text[] not null default '{}',
  icon text,
  is_active boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists services_set_updated_at on services;
create trigger services_set_updated_at before update on services
  for each row execute function set_updated_at();

-- packages ----------------------------------------------------------------
create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  name text not null,
  description text,
  features text[] not null default '{}',
  is_active boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists packages_service_id_idx on packages(service_id);

drop trigger if exists packages_set_updated_at on packages;
create trigger packages_set_updated_at before update on packages
  for each row execute function set_updated_at();

-- country_pricing -----------------------------------------------------------
create table if not exists country_pricing (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  country_code text,
  currency text not null,
  service_id uuid not null references services(id) on delete cascade,
  package_id uuid not null references packages(id) on delete cascade,
  price numeric(12, 2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country, service_id, package_id)
);

create index if not exists country_pricing_lookup_idx
  on country_pricing(country, service_id, package_id) where active;

drop trigger if exists country_pricing_set_updated_at on country_pricing;
create trigger country_pricing_set_updated_at before update on country_pricing
  for each row execute function set_updated_at();

-- projects ------------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id) on delete cascade,
  service_id uuid not null references services(id),
  package_id uuid not null references packages(id),
  country text not null,
  currency text not null,
  total_amount numeric(12, 2) not null,
  advance_amount numeric(12, 2) not null,
  remaining_amount numeric(12, 2) not null,
  status text not null default 'Inquiry' check (status in (
    'Inquiry', 'Awaiting Payment', 'Payment Confirmed', 'Project Started',
    'Design', 'Development', 'Review', 'Revision', 'Final Payment',
    'Final Delivery', 'Completed', 'Closed'
  )),
  requirements text,
  start_date timestamptz,
  expected_completion_date timestamptz,
  created_by_admin uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_customer_id_idx on projects(customer_id);

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at before update on projects
  for each row execute function set_updated_at();

-- payments --------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type text not null check (type in ('advance', 'final')),
  amount numeric(12, 2) not null,
  currency text not null,
  provider text not null default 'stripe' check (provider in ('stripe', 'paypal', 'manual')),
  provider_payment_id text,
  status text not null default 'Pending' check (status in (
    'Pending', 'Processing', 'Paid', 'Failed', 'Refunded', 'Cancelled'
  )),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_project_id_idx on payments(project_id);

drop trigger if exists payments_set_updated_at on payments;
create trigger payments_set_updated_at before update on payments
  for each row execute function set_updated_at();

-- project_files -----------------------------------------------------------
create table if not exists project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  uploaded_by uuid not null references users(id),
  category text not null check (category in (
    'Brief', 'Payment Slip', 'Design', 'Development', 'Preview', 'Documents', 'Final Delivery'
  )),
  original_name text not null,
  stored_name text not null,
  mime_type text not null,
  size integer not null,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_files_project_id_idx on project_files(project_id);

-- category check constraint gained 'Payment Slip' after this table
-- already existed on some deployments — `create table if not exists`
-- above is a no-op on a DB where project_files was already created, so
-- the constraint needs updating explicitly for anyone re-running
-- db:migrate against a pre-existing database (same pattern as the
-- portfolio_projects columns above).
alter table project_files drop constraint if exists project_files_category_check;
alter table project_files add constraint project_files_category_check check (category in (
  'Brief', 'Payment Slip', 'Design', 'Development', 'Preview', 'Documents', 'Final Delivery'
));

drop trigger if exists project_files_set_updated_at on project_files;
create trigger project_files_set_updated_at before update on project_files
  for each row execute function set_updated_at();

-- notifications -------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  project_id uuid references projects(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on notifications(user_id);

drop trigger if exists notifications_set_updated_at on notifications;
create trigger notifications_set_updated_at before update on notifications
  for each row execute function set_updated_at();

-- activity_logs -------------------------------------------------------------
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists activity_logs_project_id_idx on activity_logs(project_id);

drop trigger if exists activity_logs_set_updated_at on activity_logs;
create trigger activity_logs_set_updated_at before update on activity_logs
  for each row execute function set_updated_at();

-- inquiries -------------------------------------------------------------
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  whatsapp text,
  country text,
  service text not null,
  budget text,
  description text not null,
  reference_website text,
  preferred_deadline timestamptz,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Converted', 'Closed')),
  converted_to_project uuid references projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists inquiries_set_updated_at on inquiries;
create trigger inquiries_set_updated_at before update on inquiries
  for each row execute function set_updated_at();

-- Added after initial launch — safe to re-run on a DB that already has
-- the table (schema.sql is applied wholesale by db/migrate.js). Tracks
-- whether an admin has opened the inquiry, separate from `status`
-- (which reflects where things stand with the customer, not who's seen it).
alter table inquiries add column if not exists viewed_at timestamptz;

-- reviews -----------------------------------------------------------------
-- Customer-submitted reviews. `name`/`country` are copied from the
-- submitting user's profile at write time (not client-supplied) so a
-- review can't be posted under a spoofed identity. New reviews start
-- unapproved and only appear publicly once an admin approves them —
-- see DECISIONS.md ("no fabricated testimonials"): this table is only
-- ever populated by real customer submissions, never seed data.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  name text not null,
  country text,
  service text,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_approved_idx on reviews(approved);
create index if not exists reviews_user_id_idx on reviews(user_id);

drop trigger if exists reviews_set_updated_at on reviews;
create trigger reviews_set_updated_at before update on reviews
  for each row execute function set_updated_at();

-- portfolio_projects ------------------------------------------------------
-- Curated "recent projects" shown on the Home page and Portfolio page.
-- Admin-managed, not derived from the private `projects` table — that
-- table holds real customers' in-progress work (status, amounts) which
-- isn't public data. These rows are only ever real, completed work the
-- admin has chosen to publish (see Portfolio.jsx's existing note: no
-- invented client names or results).
create table if not exists portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  service text,
  country text,
  image_url text,
  project_url text,
  completed_on date,
  published boolean not null default false,
  tech_stack text[] not null default '{}',
  features text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Added after initial launch — safe to re-run on a DB that already has
-- the table (schema.sql is applied wholesale by db/migrate.js).
alter table portfolio_projects add column if not exists tech_stack text[] not null default '{}';
alter table portfolio_projects add column if not exists features text[] not null default '{}';

create index if not exists portfolio_projects_published_idx on portfolio_projects(published);

drop trigger if exists portfolio_projects_set_updated_at on portfolio_projects;
create trigger portfolio_projects_set_updated_at before update on portfolio_projects
  for each row execute function set_updated_at();

-- free_tool_links -----------------------------------------------------------
-- Admin-managed entries for the site Footer's "Free Tools" column (see
-- client/src/components/layout/Footer.jsx). `href` may be an internal path
-- (e.g. "/tools") or a full external URL — the Footer decides how to render
-- the link based on that. Kept separate from the interactive tools
-- themselves (client/src/pages/FreeTools.jsx), which are static React and
-- not admin-editable.
create table if not exists free_tool_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  is_active boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists free_tool_links_active_idx on free_tool_links(is_active);

drop trigger if exists free_tool_links_set_updated_at on free_tool_links;
create trigger free_tool_links_set_updated_at before update on free_tool_links
  for each row execute function set_updated_at();

-- Site-wide settings — singleton row (id is always TRUE, enforced by the
-- check constraint, so there can only ever be exactly one row). Started
-- narrow (just the two customer-facing payment method toggles) rather
-- than a generic key/value settings table — add columns here as more
-- global toggles are needed, instead of over-building a settings system
-- before there's a second real use for one.
create table if not exists settings (
  id boolean primary key default true check (id),
  stripe_payments_enabled boolean not null default true,
  whatsapp_payments_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists settings_set_updated_at on settings;
create trigger settings_set_updated_at before update on settings
  for each row execute function set_updated_at();
