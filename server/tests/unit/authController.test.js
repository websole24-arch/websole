// These test the *controller logic* around the Supabase Auth calls
// (call sequencing, error mapping, cookie-setting, rollback-on-failure) —
// not Supabase itself. There is no network access to *.supabase.co in
// this environment, so the SDK is mocked. See TEST_STATUS.md for what
// this suite covers vs. what still needs a real Supabase project.
jest.mock('../../src/lib/supabase');
jest.mock('../../src/models/User');

const request = require('supertest');
const { getSupabaseAdmin } = require('../../src/lib/supabase');
const User = require('../../src/models/User');
const app = require('../../src/app');

const mockClient = () => ({
  auth: {
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      signOut: jest.fn(),
      updateUserById: jest.fn().mockResolvedValue({ error: null }),
    },
    signInWithPassword: jest.fn(),
    signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    resend: jest.fn().mockResolvedValue({ error: null }),
    getUser: jest.fn(),
  },
});

describe('authController (mocked Supabase)', () => {
  let supabase;

  beforeEach(() => {
    supabase = mockClient();
    getSupabaseAdmin.mockReturnValue(supabase);
    jest.clearAllMocks();
    getSupabaseAdmin.mockReturnValue(supabase);
  });

  describe('POST /api/auth/register', () => {
    const body = { name: 'Alice', email: 'alice@example.com', password: 'Password123' };

    it('creates the Supabase user (unconfirmed), then the profile, then sends the confirmation email — no session yet', async () => {
      User.findByEmail.mockResolvedValue(null);
      supabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'auth-uid-1' } }, error: null });
      User.createProfile.mockResolvedValue({
        id: 'auth-uid-1', name: 'Alice', email: body.email, role: 'customer', emailVerified: false,
      });

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(201);
      expect(res.body.verificationRequired).toBe(true);
      expect(res.body.user).toBeUndefined();
      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email_confirm: false })
      );
      expect(User.createProfile).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'auth-uid-1', name: 'Alice' })
      );
      expect(supabase.auth.resend).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'signup', email: body.email })
      );
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('still creates the account if the confirmation email fails to send, but flags it', async () => {
      User.findByEmail.mockResolvedValue(null);
      supabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'auth-uid-3' } }, error: null });
      User.createProfile.mockResolvedValue({ id: 'auth-uid-3', name: 'Alice', email: body.email });
      supabase.auth.resend.mockResolvedValueOnce({ error: { message: 'send failed' } });

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(201);
      expect(res.body.emailSendFailed).toBe(true);
    });

    it('rejects a duplicate email before calling Supabase', async () => {
      User.findByEmail.mockResolvedValue({ id: 'existing' });

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(409);
      expect(supabase.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('rolls back the Supabase Auth user if the profile insert fails', async () => {
      User.findByEmail.mockResolvedValue(null);
      supabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'auth-uid-2' } }, error: null });
      User.createProfile.mockRejectedValue(new Error('db down'));

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(500);
      expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('auth-uid-2');
    });

    it('maps a real Supabase Auth error (with a status) straight through', async () => {
      User.findByEmail.mockResolvedValue(null);
      supabase.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { status: 422, message: 'Password should be at least 6 characters' },
      });

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(422);
      expect(res.body.message).toBe('Password should be at least 6 characters');
    });

    it('maps a network/infra failure (no status) to 502, not the raw error text', async () => {
      User.findByEmail.mockResolvedValue(null);
      supabase.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'fetch failed' },
      });

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(502);
      expect(res.body.message).not.toBe('fetch failed');
    });
  });

  describe('POST /api/auth/login', () => {
    const body = { email: 'alice@example.com', password: 'Password123' };

    it('signs in, loads the profile, and sets cookies', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: { access_token: 'at', refresh_token: 'rt' }, user: { id: 'auth-uid-1' } },
        error: null,
      });
      User.findById.mockResolvedValue({
        id: 'auth-uid-1', name: 'Alice', email: body.email, role: 'customer', isActive: true,
      });

      const res = await request(app).post('/api/auth/login').send(body);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(body.email);
      expect(res.headers['set-cookie'].some((c) => c.startsWith('sb_access_token='))).toBe(true);
      res.headers['set-cookie'].forEach((c) => {
        expect(c.split('; ')).toContain('Path=/');
        expect(c.split('; ')).not.toContain('Secure');
      });
    });

    it('returns 401 on bad credentials', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null }, error: { message: 'Invalid login credentials' },
      });

      const res = await request(app).post('/api/auth/login').send(body);
      expect(res.status).toBe(401);
    });

    it('returns a distinct 403 for an unconfirmed email, not a generic 401', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null }, error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
      });

      const res = await request(app).post('/api/auth/login').send(body);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/verify/i);
    });

    it('returns 403 for a disabled account even with correct credentials', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: { access_token: 'at', refresh_token: 'rt' }, user: { id: 'auth-uid-1' } },
        error: null,
      });
      User.findById.mockResolvedValue({ id: 'auth-uid-1', isActive: false });

      const res = await request(app).post('/api/auth/login').send(body);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/auth/verify', () => {
    const body = { access_token: 'at', refresh_token: 'rt' };

    it('verifies the token, marks the profile verified, and sets cookies', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-uid-1', email_confirmed_at: '2026-01-01T00:00:00Z' } },
        error: null,
      });
      User.findById.mockResolvedValue({ id: 'auth-uid-1', email: 'alice@example.com', emailVerified: false });
      User.update.mockResolvedValue({ id: 'auth-uid-1', email: 'alice@example.com', emailVerified: true });

      const res = await request(app).post('/api/auth/verify').send(body);

      expect(res.status).toBe(200);
      expect(User.update).toHaveBeenCalledWith('auth-uid-1', { emailVerified: true });
      expect(res.body.user.emailVerified).toBe(true);
      expect(res.headers['set-cookie'].some((c) => c.startsWith('sb_access_token=at'))).toBe(true);
    });

    it('does not re-update an already-verified profile', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-uid-1', email_confirmed_at: '2026-01-01T00:00:00Z' } },
        error: null,
      });
      User.findById.mockResolvedValue({ id: 'auth-uid-1', emailVerified: true });

      const res = await request(app).post('/api/auth/verify').send(body);

      expect(res.status).toBe(200);
      expect(User.update).not.toHaveBeenCalled();
    });

    it('rejects an invalid or expired token', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });

      const res = await request(app).post('/api/auth/verify').send(body);
      expect(res.status).toBe(400);
    });

    it('rejects a token for an email that is not actually confirmed yet', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-uid-1', email_confirmed_at: null } },
        error: null,
      });

      const res = await request(app).post('/api/auth/verify').send(body);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('always answers success, regardless of whether the email has an account', async () => {
      const res = await request(app).post('/api/auth/resend-verification').send({ email: 'alice@example.com' });

      expect(res.status).toBe(200);
      expect(supabase.auth.resend).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'signup', email: 'alice@example.com' })
      );
    });

    it('does not throw even if resend() itself errors', async () => {
      supabase.auth.resend.mockRejectedValueOnce(new Error('boom'));

      const res = await request(app).post('/api/auth/resend-verification').send({ email: 'alice@example.com' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/magic-link', () => {
    it('sends a login confirmation link via signInWithOtp if user exists and is active', async () => {
      User.findByEmail.mockResolvedValue({ id: 'auth-uid-1', email: 'alice@example.com', isActive: true });

      const res = await request(app).post('/api/auth/magic-link').send({ email: 'alice@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alice@example.com',
          options: expect.objectContaining({ shouldCreateUser: false }),
        })
      );
    });

    it('returns the same generic success as a nonexistent account, not a distinct 403 (prevent enumeration)', async () => {
      User.findByEmail.mockResolvedValue({ id: 'auth-uid-1', email: 'alice@example.com', isActive: false });

      const res = await request(app).post('/api/auth/magic-link').send({ email: 'alice@example.com' });

      expect(res.status).toBe(200);
      expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
    });

    it('returns generic success if user does not exist (prevent enumeration)', async () => {
      User.findByEmail.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/magic-link').send({ email: 'unknown@example.com' });

      expect(res.status).toBe(200);
      expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('calls resetPasswordForEmail and returns generic success', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'alice@example.com' });

      expect(res.status).toBe(200);
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'alice@example.com',
        expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
      );
    });
  });

  describe('POST /api/auth/reset-password', () => {
    const body = { access_token: 'valid-recovery-token', refresh_token: 'rt-token', password: 'NewPassword123' };

    it('updates password and logs user in if token is valid', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-uid-1' } },
        error: null,
      });
      User.findById.mockResolvedValue({ id: 'auth-uid-1', email: 'alice@example.com', role: 'customer' });

      const res = await request(app).post('/api/auth/reset-password').send(body);

      expect(res.status).toBe(200);
      expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith('auth-uid-1', { password: body.password });
      expect(res.body.user).toBeDefined();
      expect(res.headers['set-cookie'].some((c) => c.startsWith('sb_access_token=valid-recovery-token'))).toBe(true);
    });

    it('rejects invalid recovery tokens', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'token invalid' },
      });

      const res = await request(app).post('/api/auth/reset-password').send(body);
      expect(res.status).toBe(400);
    });
  });
});
