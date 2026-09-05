// IMPORTANT: `secure` must reflect whether *this request* actually arrived
// over HTTPS (req.secure — respects `trust proxy`, see app.js), not just
// NODE_ENV. Browsers silently refuse to *store* a cookie marked Secure if
// it was received over plain HTTP — no error, no warning, it just never
// lands in the cookie jar. That previously meant: NODE_ENV=production (set
// by many containers/hosts by default) + serving over http in dev/preview
// -> login returns 200 and looks fine, but the Set-Cookie is dropped by
// the browser -> every following request has no cookie at all -> "Not
// authenticated" on everything, right after "logging in". Deriving it
// from the request itself makes it correct in both directions: secure
// cookies whenever the connection is actually secure, plain cookies
// whenever it isn't — regardless of what NODE_ENV happens to be.
// SameSite=None is required whenever the browser treats the request as
// cross-site — which it will for this app's chosen production shape
// (client on Vercel, API on Railway/Render: different top-level domains).
// None only works paired with Secure, and browsers refuse to *store* a
// Secure cookie received over plain HTTP (see the file-level comment
// below) — so this only flips to 'none' once NODE_ENV is production,
// where the connection is HTTPS end-to-end. Local dev (same-origin via
// Vite's proxy, or same-site localhost ports) keeps 'lax', matching the
// note in ARCHITECTURE.md under "Cross-domain production note".
const sameSitePolicy = () => (process.env.NODE_ENV === 'production' ? 'none' : 'lax');

const baseOpts = (req) => ({
  httpOnly: true,
  secure: req.secure,
  sameSite: sameSitePolicy(),
  path: '/',
});

// Mirrors Supabase's own token lifetimes as closely as we can without
// inspecting the JWT here — access tokens are short-lived (Supabase
// default ~1hr), refresh tokens are long-lived. Cookie maxAge is just an
// upper bound; the tokens themselves are the real source of truth.
const setSessionCookies = (req, res, session) => {
  res.cookie('sb_access_token', session.access_token, {
    ...baseOpts(req),
    maxAge: 60 * 60 * 1000, // 1 hour
  });
  res.cookie('sb_refresh_token', session.refresh_token, {
    ...baseOpts(req),
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

const clearSessionCookies = (req, res) => {
  const opts = { ...baseOpts(req), maxAge: 0 };
  res.clearCookie('sb_access_token', opts);
  res.clearCookie('sb_refresh_token', opts);
};

module.exports = { setSessionCookies, clearSessionCookies };
