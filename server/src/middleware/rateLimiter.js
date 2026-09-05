const rateLimit = require('express-rate-limit');

// Skipped in tests for the same reason morgan is (see app.js): these
// limiters are keyed per-IP over a 15-minute window, and supertest fires
// many requests from the same IP within a single test run — without this
// a normal test suite run would trip the real production limit itself.
// Also skipped for OPTIONS: the browser sends a CORS preflight OPTIONS
// request before every cross-origin POST, and if that counts against the
// limit too, a handful of real requests silently exhausts it via
// preflights alone — the browser then reports the failure as a generic
// "CORS error" (the preflight itself got a 429, so the actual request
// never goes out), which looks like a CORS misconfiguration but isn't.
const skipRequest = (req) => process.env.NODE_ENV === 'test' || req.method === 'OPTIONS';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Was hardcoded at 1000 (raised from 300 during active QA/testing,
  // where repeated reloads across a 15-min window burn through 300 fast
  // when every page load fires several API calls at once) and never
  // dialed back down — 1000 is generous for one person testing, too
  // generous as a permanent public-facing limit. Now controlled by
  // API_RATE_LIMIT_MAX so it can be set per-environment without a code
  // change; defaults to a production-appropriate 300 if unset.
  max: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRequest,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRequest,
  message: { success: false, message: 'Too many attempts, please try again later.' },
});

// For public, unauthenticated form submissions (e.g. POST /inquiries).
// The global apiLimiter (300/15min) still applies on top of this, but
// that's sized for a whole IP's worth of normal browsing/API traffic —
// too loose to stop one visitor from spamming a specific form. Same
// window and cap as authLimiter, since both are "a person filling out a
// form by hand" rates.
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRequest,
  message: { success: false, message: 'Too many submissions, please try again later.' },
});

module.exports = { apiLimiter, authLimiter, formLimiter };
