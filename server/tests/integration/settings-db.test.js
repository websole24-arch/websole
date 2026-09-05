const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');

// See tests/integration/projects-db.test.js for the rationale (real
// Postgres required, skipped by default, RUN_DB_TESTS=1 to run).
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

d('Settings (payment-method toggles) against a live Postgres DB', () => {
  let customerId;
  let adminId;
  let cookieCustomer;
  let cookieAdmin;
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

    const makeUser = async (name, role) => {
      const { rows } = await pool.query(
        `insert into auth.users (email) values ($1) returning id`,
        [`${name.toLowerCase()}-${stamp}@example.com`]
      );
      const id = rows[0].id;
      await pool.query(
        `insert into users (id, name, email, role, is_active) values ($1, $2, $3, $4, true)`,
        [id, name, `${name.toLowerCase()}-${stamp}@example.com`, role]
      );
      return id;
    };

    customerId = await makeUser('SettingsTestCustomer', 'customer');
    adminId = await makeUser('SettingsTestAdmin', 'admin');
    cookieCustomer = makeSessionCookie(customerId);
    cookieAdmin = makeSessionCookie(adminId);

    // schema.sql seeds the singleton row itself (insert ... on conflict
    // do nothing) — reset it to known defaults here so this suite isn't
    // order-dependent on whatever a previous test run last set it to.
    await pool.query(
      `update settings set stripe_payments_enabled = true, whatsapp_payments_enabled = true where id = true`
    );
  });

  afterAll(async () => {
    await pool.query('delete from users where id = any($1)', [[customerId, adminId]]);
    await pool.query('delete from auth.users where id = any($1)', [[customerId, adminId]]);
    await pool.end();
  });

  it('is readable with no session at all (public)', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.settings).toEqual(
      expect.objectContaining({ stripePaymentsEnabled: true, whatsappPaymentsEnabled: true })
    );
  });

  it('blocks a logged-in customer from updating settings (403, not just 401)', async () => {
    const res = await request(app)
      .patch('/api/settings')
      .set('Cookie', cookieCustomer)
      .send({ stripePaymentsEnabled: false });

    expect(res.status).toBe(403);
  });

  it('lets an admin turn a payment method off, and GET reflects it', async () => {
    const patchRes = await request(app)
      .patch('/api/settings')
      .set('Cookie', cookieAdmin)
      .send({ stripePaymentsEnabled: false });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.settings.stripePaymentsEnabled).toBe(false);

    const getRes = await request(app).get('/api/settings');
    expect(getRes.body.settings.stripePaymentsEnabled).toBe(false);
  });

  it('partial update leaves the other toggle untouched', async () => {
    // Coming into this test, the previous one already set
    // stripePaymentsEnabled: false. Only touch whatsapp here and confirm
    // stripe's value survives — this is what proves the update is a
    // COALESCE, not an accidental full overwrite back to the column's
    // schema default.
    const res = await request(app)
      .patch('/api/settings')
      .set('Cookie', cookieAdmin)
      .send({ whatsappPaymentsEnabled: false });

    expect(res.status).toBe(200);
    expect(res.body.settings).toEqual(
      expect.objectContaining({ stripePaymentsEnabled: false, whatsappPaymentsEnabled: false })
    );
  });
});
