// Covers middleware/auth.js's network fallback: local HS256 verification
// (utils/supabaseJwt.js) fails unconditionally on Supabase projects that
// sign access tokens with an asymmetric key instead of the legacy shared
// secret — see TODO.md/DECISIONS.md. Before the fallback existed, that
// looked exactly like: login succeeds, then every following request
// 401s "Not authenticated" and wipes the session cookies, even for a
// token that was actually valid seconds earlier. GET /api/auth/me (which
// uses the soft attachUserIfPresent) is a convenient way to exercise
// resolveUser() through real cookies without needing a protected route.
jest.mock('../../src/lib/supabase');
jest.mock('../../src/models/User');

const request = require('supertest');
const { getSupabaseAdmin } = require('../../src/lib/supabase');
const User = require('../../src/models/User');
const app = require('../../src/app');

// Not a real Supabase-signed token — jwt.verify(garbage, secret) throws
// JsonWebTokenError, i.e. exactly the non-expiry failure this fallback
// exists for (as opposed to a real expired token, which throws
// TokenExpiredError and takes the separate refresh path).
const GARBAGE_TOKEN = 'not-a-real-jwt';

const asCookies = (token) => [`sb_access_token=${token}`, 'sb_refresh_token=rt'];

describe('protect/attachUserIfPresent — network fallback on local verify failure', () => {
  let supabase;

  beforeEach(() => {
    supabase = { auth: { getUser: jest.fn() } };
    getSupabaseAdmin.mockReturnValue(supabase);
    jest.clearAllMocks();
    getSupabaseAdmin.mockReturnValue(supabase);
  });

  it('accepts a token that fails local verification but Supabase confirms is valid', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-uid-1' } }, error: null,
    });
    User.findById.mockResolvedValue({
      id: 'auth-uid-1', name: 'Alice', email: 'alice@example.com', role: 'customer', isActive: true,
    });

    const res = await request(app).get('/api/auth/me').set('Cookie', asCookies(GARBAGE_TOKEN));

    expect(res.status).toBe(200);
    expect(supabase.auth.getUser).toHaveBeenCalledWith(GARBAGE_TOKEN);
    expect(res.body.user.id).toBe('auth-uid-1');
    // A genuinely-valid session must not have its cookies wiped.
    expect((res.headers['set-cookie'] || []).some((c) => c.startsWith('sb_access_token=;'))).toBe(false);
  });

  it('clears cookies and treats the session as logged-out when Supabase also rejects the token', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });

    const res = await request(app).get('/api/auth/me').set('Cookie', asCookies(GARBAGE_TOKEN));

    expect(res.status).toBe(200); // attachUserIfPresent never throws
    expect(res.body.user).toBeNull();
    expect((res.headers['set-cookie'] || []).some((c) => c.startsWith('sb_access_token=;'))).toBe(true);
  });

  it('never hits the network for a well-formed, validly-signed token', async () => {
    // Sanity check that the fast (local, no-network) path is still the
    // one taken when SUPABASE_JWT_SECRET actually matches — the network
    // fallback should only fire on verification failure, not always.
    const jwt = require('jsonwebtoken');
    const originalSecret = process.env.SUPABASE_JWT_SECRET;
    process.env.SUPABASE_JWT_SECRET = 'test-secret';
    try {
      const token = jwt.sign({ sub: 'auth-uid-2', role: 'authenticated' }, 'test-secret', {
        algorithm: 'HS256', expiresIn: '1h',
      });
      User.findById.mockResolvedValue({
        id: 'auth-uid-2', name: 'Bob', email: 'bob@example.com', role: 'customer', isActive: true,
      });

      const res = await request(app).get('/api/auth/me').set('Cookie', asCookies(token));

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe('auth-uid-2');
      expect(supabase.auth.getUser).not.toHaveBeenCalled();
    } finally {
      process.env.SUPABASE_JWT_SECRET = originalSecret;
    }
  });
});
