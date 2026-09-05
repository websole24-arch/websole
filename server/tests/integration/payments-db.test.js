const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');

// See tests/integration/projects-db.test.js for the rationale (real
// Postgres required, skipped by default, RUN_DB_TESTS=1 to run). This
// suite covers the "Project Started" payment gate added alongside the
// Stripe integration — it exercises real Payment/Project rows, not
// Stripe itself (Stripe SDK calls are covered, mocked, in
// tests/unit/paymentController.test.js — this sandbox has no network
// access to api.stripe.com either, same as *.supabase.co).
const shouldRun = process.env.RUN_DB_TESTS === '1';
const d = shouldRun ? describe : describe.skip;

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'test-secret-key-for-jest';

const makeSessionCookie = (userId) => {
  const token = jwt.sign(
    { sub: userId, email: `${userId}@example.com`, role: 'authenticated' },
    SUPABASE_JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );
  return `sb_access_token=${token}`;
};

d('Payment gate against a live Postgres DB', () => {
  let serviceId;
  let packageId;
  let customerId;
  let adminId;
  let cookieCustomer;
  let cookieAdmin;
  let projectId;
  const stamp = Date.now();

  beforeAll(async () => {
    await pool.query('create schema if not exists auth');
    await pool.query(`
      create table if not exists auth.users (
        id uuid primary key default gen_random_uuid(),
        email text
      )
    `);

    const schema = fs.readFileSync(path.join(__dirname, '../../src/db/schema.sql'), 'utf8');
    await pool.query(schema);

    const svc = await pool.query(
      `insert into services (name, slug, short_description, description)
       values ('Test Service', $1, 'x', 'x') returning id`,
      [`payments-test-service-${stamp}`]
    );
    serviceId = svc.rows[0].id;

    const pkg = await pool.query(
      `insert into packages (service_id, name) values ($1, 'Test Package') returning id`,
      [serviceId]
    );
    packageId = pkg.rows[0].id;

    await pool.query(
      `insert into country_pricing (country, currency, service_id, package_id, price)
       values ('International', 'USD', $1, $2, 200)`,
      [serviceId, packageId]
    );

    const makeUser = async (name, role) => {
      const { rows } = await pool.query(
        `insert into auth.users (email) values ($1) returning id`,
        [`${name.toLowerCase()}-${stamp}@example.com`]
      );
      const id = rows[0].id;
      await pool.query(
        `insert into users (id, name, email, role, is_active)
         values ($1, $2, $3, $4, true)`,
        [id, name, `${name.toLowerCase()}-${stamp}@example.com`, role]
      );
      return id;
    };

    customerId = await makeUser('PayTestCustomer', 'customer');
    adminId = await makeUser('PayTestAdmin', 'admin');
    cookieCustomer = makeSessionCookie(customerId);
    cookieAdmin = makeSessionCookie(adminId);

    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', cookieCustomer)
      .send({ service: serviceId, package: packageId, country: 'International' });
    projectId = res.body.project.id;
  });

  afterAll(async () => {
    await pool.query('delete from payments where project_id = $1', [projectId]);
    await pool.query('delete from projects where id = $1', [projectId]);
    await pool.query('delete from users where id = any($1)', [[customerId, adminId]]);
    await pool.query('delete from auth.users where id = any($1)', [[customerId, adminId]]);
    await pool.query('delete from country_pricing where service_id = $1', [serviceId]);
    await pool.query('delete from packages where id = $1', [packageId]);
    await pool.query('delete from services where id = $1', [serviceId]);
    await pool.end();
  });

  it('blocks moving to Project Started with no paid advance', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}/status`)
      .set('Cookie', cookieAdmin)
      .send({ status: 'Project Started' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/advance payment/i);
  });

  it('reports advancePaid: false on the project while unpaid', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`).set('Cookie', cookieCustomer);
    expect(res.body.project.advancePaid).toBe(false);
  });

  it('allows Project Started once a Paid advance payment row exists', async () => {
    // Simulates what the webhook does on checkout.session.completed —
    // inserted directly since this sandbox has no network path to
    // api.stripe.com to actually run a Checkout Session through.
    await pool.query(
      `insert into payments (project_id, type, amount, currency, provider, provider_payment_id, status, paid_at)
       values ($1, 'advance', 100, 'USD', 'stripe', 'cs_test_fixture', 'Paid', now())`,
      [projectId]
    );

    const res = await request(app)
      .patch(`/api/projects/${projectId}/status`)
      .set('Cookie', cookieAdmin)
      .send({ status: 'Project Started' });

    expect(res.status).toBe(200);
    expect(res.body.project.status).toBe('Project Started');
  });

  it('now reports advancePaid: true on the project', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`).set('Cookie', cookieCustomer);
    expect(res.body.project.advancePaid).toBe(true);
    expect(res.body.payments).toHaveLength(1);
    expect(res.body.payments[0].status).toBe('Paid');
  });
});
