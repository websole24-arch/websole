// Supabase Auth issues its own JWTs when signing a user in — we no longer
// sign tokens ourselves (see DECISIONS.md, "Supabase Auth migration").
//
// This verifies them locally (no network call) using the project's legacy
// HS256 JWT secret (Supabase dashboard: Project Settings -> API -> JWT
// Secret). This is the fast path and mirrors how the old custom-JWT
// middleware worked.
//
// CAVEAT: newer Supabase projects can be configured to sign with an
// asymmetric key instead (JWKS), in which case this shared secret doesn't
// exist / won't verify tokens. middleware/auth.js's resolveUser() already
// falls back to a real supabase.auth.getUser() network check whenever
// local verification fails for a non-expiry reason, so that case is
// handled — just slower (a network round trip on every request) than the
// local fast path this file provides when the shared secret does match.
const jwt = require('jsonwebtoken');

const verifySupabaseAccessToken = (token) => {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET is not set');
  }
  // Supabase access tokens are HS256 by default on projects using the
  // legacy shared secret.
  return jwt.verify(token, process.env.SUPABASE_JWT_SECRET, { algorithms: ['HS256'] });
};

module.exports = { verifySupabaseAccessToken };
