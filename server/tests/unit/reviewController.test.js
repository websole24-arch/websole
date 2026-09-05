// createReview's eligibility gate (a customer must have at least one
// Completed project before they can leave a review) — the dashboard
// only shows the review form once that's true, but this is the actual
// enforcement, since POST /api/reviews is reachable directly regardless
// of what the client shows. Uses a real HS256-signed token (protect's
// local-verify fast path) rather than mocking lib/supabase, since that
// path is never exercised here — see authMiddleware.test.js for the
// network-fallback case specifically.
jest.mock('../../src/models/Review');
jest.mock('../../src/models/Project');
jest.mock('../../src/models/User');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const Review = require('../../src/models/Review');
const Project = require('../../src/models/Project');
const User = require('../../src/models/User');
const app = require('../../src/app');

const SECRET = 'test-secret-key-for-jest';
const CUSTOMER_ID = 'auth-uid-customer-1';

const cookieFor = (userId) => {
  const token = jwt.sign({ sub: userId, role: 'authenticated' }, SECRET, {
    algorithm: 'HS256', expiresIn: '1h',
  });
  return `sb_access_token=${token}`;
};

describe('POST /api/reviews — completed-project eligibility gate', () => {
  const originalSecret = process.env.SUPABASE_JWT_SECRET;
  const body = { rating: 5, comment: 'Great experience working with the team.' };

  beforeAll(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.SUPABASE_JWT_SECRET = originalSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockResolvedValue({
      id: CUSTOMER_ID, name: 'Alice', email: 'alice@example.com', role: 'customer',
      country: 'International', isActive: true,
    });
    Review.findByUser.mockResolvedValue(null);
  });

  it('rejects with 403 when the customer has no Completed project yet', async () => {
    Project.hasCompletedProject.mockResolvedValue(false);

    const res = await request(app).post('/api/reviews').set('Cookie', cookieFor(CUSTOMER_ID)).send(body);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/completed/i);
    expect(Review.create).not.toHaveBeenCalled();
  });

  it('allows submission once the customer has a Completed project', async () => {
    Project.hasCompletedProject.mockResolvedValue(true);
    Review.create.mockResolvedValue({ id: 'rev-1', ...body, approved: false });

    const res = await request(app).post('/api/reviews').set('Cookie', cookieFor(CUSTOMER_ID)).send(body);

    expect(res.status).toBe(201);
    expect(Project.hasCompletedProject).toHaveBeenCalledWith(CUSTOMER_ID);
    expect(Review.create).toHaveBeenCalledWith(expect.objectContaining({ userId: CUSTOMER_ID, rating: 5 }));
  });

  it('still blocks a duplicate review before even checking eligibility', async () => {
    Review.findByUser.mockResolvedValue({ id: 'existing-review' });

    const res = await request(app).post('/api/reviews').set('Cookie', cookieFor(CUSTOMER_ID)).send(body);

    expect(res.status).toBe(400);
    expect(Project.hasCompletedProject).not.toHaveBeenCalled();
  });
});
