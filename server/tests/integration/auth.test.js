const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/auth/register validation', () => {
  it('rejects a missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', password: 'Passw0rd1' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });
});
