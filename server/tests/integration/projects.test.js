const request = require('supertest');
const app = require('../../src/app');

describe('Projects API auth gate', () => {
  it('rejects POST /api/projects with no session', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ service: 'x', package: 'y', country: 'International' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects GET /api/projects with no session', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('rejects GET /api/projects/:id with no session', async () => {
    const res = await request(app).get('/api/projects/000000000000000000000000');
    expect(res.status).toBe(401);
  });

  it('rejects PATCH /api/projects/:id/status with no session', async () => {
    const res = await request(app)
      .patch('/api/projects/000000000000000000000000/status')
      .send({ status: 'Development' });
    expect(res.status).toBe(401);
  });
});

// NOTE: ownership (IDOR) and role checks need a live Supabase/Postgres DB —
// this sandbox has none. Once DATABASE_URL is available, add:
//   - Customer A creates a project, Customer B GETs it -> expect 403
//   - Non-admin PATCHes status -> expect 403
//   - Admin PATCHes status -> expect 200 + an ActivityLog row created
