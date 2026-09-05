const { verifySupabaseAccessToken } = require('../utils/supabaseJwt');
const { getSupabaseAdmin } = require('../lib/supabase');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { setSessionCookies, clearSessionCookies } = require('../utils/sessionCookies');

const loadProfile = async (userId) => {
  const profile = await User.findById(userId);
  if (!profile || !profile.isActive) return null;
  return profile;
};

// Supabase access tokens are short-lived (~1hr by default). Rather than
// force a re-login every hour, attempt one silent refresh using the
// refresh_token cookie when the access token has expired. This is the
// one part of `protect` that needs the network (Supabase's token
// endpoint) — see DECISIONS.md / TEST_STATUS.md for what is and isn't
// verified against a live Supabase project. Returns null (rather than
// throwing) on any failure so it composes with resolveUser below.
const attemptRefresh = async (req, res) => {
  const refreshToken = req.cookies?.sb_refresh_token;
  if (!refreshToken) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return null;

  setSessionCookies(req, res, data.session);
  return data.session.user.id;
};

// Network fallback for when local HS256 verification fails for a reason
// OTHER than expiry. In practice this fires constantly on Supabase
// projects that sign access tokens with an asymmetric key instead of
// exposing the legacy shared secret (see supabaseJwt.js) — every single
// token fails local verification then, including freshly-issued valid
// ones right after login, which without this fallback looked exactly
// like: login succeeds (200), then every following request 401s
// "Not authenticated" and the session cookies get wiped. This confirms
// the token against Supabase directly before treating it as invalid.
const verifyViaSupabaseNetwork = async (accessToken) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user.id;
};

// Resolves the current user from the session cookies without ever
// throwing — returns the profile, or null if there just isn't a valid
// session (missing/expired/invalid token, failed refresh, inactive
// account). Shared by `protect`, which turns a null into a 401, and
// `attachUserIfPresent`, which is perfectly happy with null — see
// authRoutes.js for why GET /auth/me uses the latter.
const resolveUser = async (req, res) => {
  const accessToken = req.cookies?.sb_access_token;
  if (!accessToken) return null;

  let userId;
  try {
    const claims = verifySupabaseAccessToken(accessToken);
    userId = claims.sub;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      userId = await attemptRefresh(req, res);
      if (!userId) return null;
    } else {
      // Local verification failed for a non-expiry reason (bad
      // signature, wrong/missing SUPABASE_JWT_SECRET, or a signing-key
      // mismatch) — don't assume that means the token is actually
      // invalid. Check with Supabase directly first; only clear the
      // session if Supabase itself rejects it too.
      userId = await verifyViaSupabaseNetwork(accessToken);
      if (!userId) {
        clearSessionCookies(req, res);
        return null;
      }
    }
  }

  return loadProfile(userId);
};

const protect = asyncHandler(async (req, res, next) => {
  req.user = await resolveUser(req, res);
  if (!req.user) throw new ApiError(401, 'Not authenticated');
  next();
});

// Soft version of `protect` for routes that need to answer "who (if
// anyone) is signed in" rather than treat "nobody" as an error. GET
// /auth/me is the prime example: every anonymous page load calls it once
// to check for an existing session, so treating "not logged in" as a 401
// meant a scary red "Unauthorized" line in the browser console on every
// single visit for something that isn't actually a problem. This never
// throws — req.user is just null when there's no valid session, and the
// controller returns 200 with { user: null }.
const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  req.user = await resolveUser(req, res);
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Not authorized for this action'));
  }
  next();
};

module.exports = { protect, attachUserIfPresent, authorize };
