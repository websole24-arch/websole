const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');

// These hit a real Postgres instance (local, or Supabase). Skipped by
// default so `npm test` stays DB-free in environments without one — see
// TEST_STATUS.md for how to run this suite.
//
// Register/login themselves need real network to Supabase Auth (not
// available in this sandbox — see TEST_STATUS.md), so this suite mints
// its own Supabase-shaped JWTs and inserts profile rows directly rather
// than going through POST /api/auth/register. That still fully exercises
// the `protect` middleware's local-verification path and the entire
// Projects flow underneath it — just not the register/login endpoints
// themselves, which have separate mocked coverage in
// tests/unit/authController.test.js.
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

d('Projects API against a live Postgres DB', () => {
  let serviceId;
  let packageId;
  let customerAId;
  let customerBId;
  let adminId;
  let cookieA;
  let cookieB;
  let cookieAdmin;
  const stamp = Date.now();

  beforeAll(async () => {
    // Stand-in for Supabase's own auth.users table, which this sandbox's
    // local Postgres doesn't have. A real Supabase project already
    // provisions this — schema.sql intentionally does not create it.
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
      [`test-service-${stamp}`]
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

    customerAId = await makeUser('TestCustomerA', 'customer');
    customerBId = await makeUser('TestCustomerB', 'customer');
    adminId = await makeUser('TestAdmin', 'admin');

    cookieA = makeSessionCookie(customerAId);
    cookieB = makeSessionCookie(customerBId);
    cookieAdmin = makeSessionCookie(adminId);
  });

  afterAll(async () => {
    await pool.query('delete from users where id = any($1)', [[customerAId, customerBId, adminId]]);
    await pool.query('delete from auth.users where id = any($1)', [[customerAId, customerBId, adminId]]);
    await pool.query('delete from country_pricing where service_id = $1', [serviceId]);
    await pool.query('delete from packages where id = $1', [packageId]);
    await pool.query('delete from services where id = $1', [serviceId]);
    await pool.end();
  });

  let projectId;

  it('lets a customer create a project with the correct 50/50 split', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', cookieA)
      .send({ service: serviceId, package: packageId, country: 'International' });

    expect(res.status).toBe(201);
    expect(res.body.project.totalAmount).toBe(200);
    expect(res.body.project.advanceAmount).toBe(100);
    expect(res.body.project.remainingAmount).toBe(100);
    expect(res.body.project.status).toBe('Awaiting Payment');
    projectId = res.body.project.id;
  });

  it('lets the owner GET their own project', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`).set('Cookie', cookieA);
    expect(res.status).toBe(200);
    expect(res.body.project.customer.id).toBe(customerAId);
  });

  it('blocks a different customer from GETting it (IDOR)', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`).set('Cookie', cookieB);
    expect(res.status).toBe(403);
  });

  it('blocks a non-admin from updating status', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}/status`)
      .set('Cookie', cookieA)
      .send({ status: 'Development' });
    expect(res.status).toBe(403);
  });

  it('lets an admin update status and writes an ActivityLog row', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}/status`)
      .set('Cookie', cookieAdmin)
      .send({ status: 'Development' });

    expect(res.status).toBe(200);
    expect(res.body.project.status).toBe('Development');

    const { rows } = await pool.query(
      `select action, meta from activity_logs where project_id = $1 order by created_at`,
      [projectId]
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].action).toBe('Project created');
    expect(rows[1].action).toBe('Status changed');
    expect(rows[1].meta).toEqual({ from: 'Awaiting Payment', to: 'Development' });
  });
});
