const jwt = require('jsonwebtoken');

const SECRET = 'test-supabase-jwt-secret';

describe('supabaseJwt utils', () => {
  beforeAll(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET;
  });

  // eslint-disable-next-line global-require
  const { verifySupabaseAccessToken } = require('../../src/utils/supabaseJwt');

  const makeToken = (overrides = {}) =>
    jwt.sign(
      { sub: 'user-123', email: 'a@example.com', role: 'authenticated', ...overrides },
      SECRET,
      { algorithm: 'HS256', expiresIn: overrides.expiresIn || '1h' }
    );

  it('verifies a validly signed Supabase-shaped token', () => {
    const token = makeToken();
    const claims = verifySupabaseAccessToken(token);
    expect(claims.sub).toBe('user-123');
    expect(claims.role).toBe('authenticated');
  });

  it('throws on a token signed with the wrong secret', () => {
    const token = jwt.sign({ sub: 'user-123' }, 'wrong-secret', { algorithm: 'HS256' });
    expect(() => verifySupabaseAccessToken(token)).toThrow();
  });

  it('throws TokenExpiredError on an expired token', () => {
    const token = jwt.sign({ sub: 'user-123' }, SECRET, { algorithm: 'HS256', expiresIn: -10 });
    expect(() => verifySupabaseAccessToken(token)).toThrow('jwt expired');
  });

  it('throws a clear error when SUPABASE_JWT_SECRET is unset', () => {
    delete process.env.SUPABASE_JWT_SECRET;
    const token = makeToken();
    expect(() => verifySupabaseAccessToken(token)).toThrow('SUPABASE_JWT_SECRET is not set');
    process.env.SUPABASE_JWT_SECRET = SECRET;
  });
});
