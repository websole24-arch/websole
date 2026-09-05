const { getSupabaseAdmin } = require('../lib/supabase');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { setSessionCookies, clearSessionCookies } = require('../utils/sessionCookies');

const sanitizeUser = (profile) => ({
  id: profile.id,
  name: profile.name,
  email: profile.email,
  role: profile.role,
  country: profile.country,
  phone: profile.phone,
  companyName: profile.companyName,
  emailVerified: profile.emailVerified,
});

// Where Supabase sends people after they click the confirmation link in
// the email. Must also be added to the project's Auth -> URL
// Configuration -> Redirect URLs allow list, or Supabase rejects it.
// CLIENT_ORIGIN can be a comma-separated list (see app.js) — the first
// entry is the canonical client origin used for outbound links like this.
const VERIFY_REDIRECT_URL = `${(process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0]}/auth/callback`;

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, country, companyName } = req.body;
  const supabase = getSupabaseAdmin();

  const existing = await User.findByEmail(email);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  // Supabase owns the credential (hashing, rate limiting, lockout) from
  // here on — see DECISIONS.md. email_confirm left false so the account
  // starts unverified; the confirmation email is triggered explicitly
  // below via resend(), which uses Supabase's own signup email template
  // and confirmation link.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });
  if (createError) {
    // supabase-js returns network/infra failures (Supabase unreachable,
    // DNS, timeout, ...) in this same {data, error} shape, but without a
    // real HTTP status — only genuine Auth API responses (duplicate
    // email, weak password, etc.) carry one. Treat the former as a 502,
    // not a 400 — a fetch failure isn't the client's fault, and "fetch
    // failed" isn't a message worth showing them. Caught by actually
    // running this against an unreachable Supabase URL this session —
    // see DECISIONS.md.
    const status = createError.status >= 400 ? createError.status : 502;
    const message = createError.status
      ? (createError.message || 'Could not create account')
      : 'Could not reach the authentication service. Please try again shortly.';
    throw new ApiError(status, message);
  }

  let profile;
  try {
    profile = await User.createProfile({
      id: created.user.id, name, email, phone, country, companyName,
    });
  } catch (err) {
    // Roll back the auth user so a failed profile insert doesn't leave an
    // orphaned Supabase Auth account with no matching row in `users`.
    await supabase.auth.admin.deleteUser(created.user.id).catch(() => {});
    throw err;
  }

  // admin.createUser never sends an email itself, regardless of
  // email_confirm — resend() is the supported way to get Supabase's real
  // confirmation email (with the verification link) sent for an
  // already-created, not-yet-confirmed user. Best-effort: a failed send
  // shouldn't fail registration, since the account+profile already
  // exist — surface the message and let the client offer "resend".
  const { error: resendError } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: VERIFY_REDIRECT_URL },
  });

  // No session yet — Supabase won't hand out a session for an unconfirmed
  // account, and this app shouldn't either. The user (both customer and
  // admin accounts share this endpoint's underlying flow) gets a session
  // only after clicking the emailed link, via POST /auth/verify below.
  res.status(201).json({
    success: true,
    verificationRequired: true,
    emailSendFailed: Boolean(resendError),
    message: resendError
      ? 'Account created, but the verification email could not be sent. Use "resend" on the login page.'
      : 'Account created. Check your email for a verification link before logging in.',
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    // Supabase itself refuses to issue a session for an unconfirmed
    // account (error.code === 'email_not_confirmed') — surface that
    // distinctly so the client can offer "resend verification email"
    // instead of just "wrong password".
    if (error?.code === 'email_not_confirmed') {
      throw new ApiError(403, 'Please verify your email before logging in. Check your inbox for the confirmation link.');
    }
    throw new ApiError(401, 'Invalid email or password');
  }

  const profile = await User.findById(data.user.id);
  if (!profile) throw new ApiError(401, 'Invalid email or password');
  if (!profile.isActive) throw new ApiError(403, 'Account is disabled. Contact support.');

  setSessionCookies(req, res, data.session);
  res.json({ success: true, user: sanitizeUser(profile) });
});

// Called by the client's /auth/callback page with the access_token /
// refresh_token Supabase appended to the confirmation-link redirect.
// Verifying the access_token (rather than trusting the client) confirms
// the email really was confirmed, then promotes it into a real session
// and flips the profile's emailVerified flag — the one place that
// happens, for both customer and admin accounts.
const verifyEmail = asyncHandler(async (req, res) => {
  const { access_token: accessToken, refresh_token: refreshToken } = req.body;
  if (!accessToken || !refreshToken) {
    throw new ApiError(400, 'Missing verification tokens');
  }
  const supabase = getSupabaseAdmin();

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    throw new ApiError(400, 'This verification link is invalid or has expired');
  }
  if (!userData.user.email_confirmed_at) {
    throw new ApiError(400, 'Email is not confirmed yet');
  }

  let profile = await User.findById(userData.user.id);
  if (!profile) throw new ApiError(404, 'Account not found');
  if (!profile.emailVerified) {
    profile = await User.update(userData.user.id, { emailVerified: true });
  }

  setSessionCookies(req, res, { access_token: accessToken, refresh_token: refreshToken });
  res.json({ success: true, user: sanitizeUser(profile) });
});

// Re-sends the Supabase confirmation email — for people who registered
// but lost/expired the original link. Always answers success either way
// so this can't be used to probe which emails have accounts.
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');
  const supabase = getSupabaseAdmin();

  await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: VERIFY_REDIRECT_URL },
  }).catch(() => {});

  res.json({ success: true, message: 'If that account needs verification, a new email has been sent.' });
});

// Magic link / Login confirmation link. Supabase sends a one-time sign-in link
// that redirects back to /auth/callback, allowing the user to confirm login from email.
const sendMagicLink = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const supabase = getSupabaseAdmin();

  const existing = await User.findByEmail(email);
  if (!existing) {
    // Avoid user enumeration by returning a generic friendly message
    return res.json({
      success: true,
      message: 'If that email is registered, a login confirmation link has been sent.',
    });
  }

  if (!existing.isActive) {
    // Same generic message as the !existing branch above — a distinct
    // "disabled" message here would let a caller confirm the account
    // exists just by trying different emails.
    return res.json({
      success: true,
      message: 'If that email is registered, a login confirmation link has been sent.',
    });
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: VERIFY_REDIRECT_URL,
      shouldCreateUser: false,
    },
  });

  if (error) {
    throw new ApiError(400, error.message || 'Could not send login confirmation link');
  }

  res.json({
    success: true,
    message: 'Login confirmation link sent! Check your inbox to sign in.',
  });
});

const RESET_REDIRECT_URL = `${(process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0]}/reset-password`;

// Sends password recovery email via Supabase Auth
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const supabase = getSupabaseAdmin();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: RESET_REDIRECT_URL,
  }).catch(() => {});

  res.json({
    success: true,
    message: 'If an account exists with that email, password reset instructions have been sent.',
  });
});

// Verifies the recovery access token and updates the user's password
const resetPassword = asyncHandler(async (req, res) => {
  const { access_token: accessToken, refresh_token: refreshToken, password } = req.body;
  const supabase = getSupabaseAdmin();

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    throw new ApiError(400, 'This password reset link is invalid or has expired');
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userData.user.id, {
    password,
  });

  if (updateError) {
    throw new ApiError(400, updateError.message || 'Could not update password');
  }

  const profile = await User.findById(userData.user.id);
  if (!profile) throw new ApiError(404, 'Account not found');

  if (refreshToken) {
    setSessionCookies(req, res, { access_token: accessToken, refresh_token: refreshToken });
  }

  res.json({
    success: true,
    user: sanitizeUser(profile),
    message: 'Password has been reset successfully. You are now logged in.',
  });
});

const logout = asyncHandler(async (req, res) => {
  const accessToken = req.cookies?.sb_access_token;
  if (accessToken) {
    // Revokes the refresh token server-side (a real improvement over the
    // old custom-JWT logout, which could only clear the cookie — a
    // signed JWT can't be invalidated without a blocklist. See
    // DECISIONS.md).
    // admin.signOut(jwt) calls GoTrue's /logout with this access token as
    // the bearer and scope defaulting to 'global', which revokes the
    // associated refresh token(s) server-side — this is the correct
    // admin API for server-initiated logout, not a client-only method.
    const supabase = getSupabaseAdmin();
    await supabase.auth.admin.signOut(accessToken).catch(() => {});
  }
  clearSessionCookies(req, res);
  res.json({ success: true, message: 'Logged out' });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user ? sanitizeUser(req.user) : null });
});

module.exports = {
  register,
  login,
  sendMagicLink,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
};

