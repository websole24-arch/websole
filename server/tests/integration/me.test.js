const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/auth/me with no session', () => {
  it('returns 200 with a null user, not a 401', async () => {
    // This is the "who's logged in, if anyone" check the frontend fires
    // on every page load. It used to 401 here (via the same `protect`
    // middleware as everything else), which is technically correct but
    // meant every anonymous visit logged a red "Unauthorized" line in the
    // browser console for something that isn't actually an error.
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeNull();
  });
});
