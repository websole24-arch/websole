const request = require('supertest');
const app = require('../../src/app');

// These endpoints all require an authenticated admin. Same coverage shape
// as tests/integration/projects.test.js: no live Supabase/Postgres in this
// sandbox, so only the "no session" 401 path is exercised here. Once a DB
// is available, add the admin-vs-customer 403 case for each route too.
describe('Admin-only routes auth gate', () => {
  const cases = [
    ['get', '/api/services/admin/all'],
    ['get', '/api/packages/admin/all'],
    ['get', '/api/pricing/admin/all'],
    ['get', '/api/free-tools/admin/all'],
    ['get', '/api/users'],
    ['patch', '/api/users/00000000-0000-0000-0000-000000000000'],
    ['patch', '/api/settings'],
  ];

  it.each(cases)('rejects %s %s with no session', async (method, path) => {
    const res = await request(app)[method](path).send({ isActive: false });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
