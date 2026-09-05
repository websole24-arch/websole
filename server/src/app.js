const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const morgan = require('morgan');

const routes = require('./routes');
const { handleWebhook } = require('./controllers/paymentController');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Needed so req.secure (used to decide whether auth cookies get the
// Secure flag — see sessionCookies.js) reflects the original client
// connection rather than the plain-HTTP hop from a TLS-terminating
// reverse proxy/load balancer in front of this server in production.
app.set('trust proxy', 1);

// .trim() matters here: CLIENT_ORIGIN=a.com, b.com (space after the
// comma — an easy copy/paste habit) would otherwise leave " b.com" as
// the second entry, which never exact-matches an Origin header and
// silently CORS-blocks that domain with no indication why. Also strips
// any trailing slash for the same reason — https://a.com/ and
// https://a.com are different strings to a browser's Origin header,
// which never includes a trailing slash.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''));

// Vercel gives every preview deploy a fresh, randomly-suffixed URL
// (studio-eight-blue-70.vercel.app, studio-six-eta-63.vercel.app, ...),
// which makes an exact-match allowlist alone a chore to keep updated.
// CLIENT_ORIGIN_PREVIEW_PREFIX (optional — e.g. "studio", your Vercel
// project name) lets those match automatically via a regex scoped to
// YOUR project's own preview naming pattern specifically.
//
// This is NOT the same as matching any *.vercel.app: doing that with
// credentials:true would let ANY site hosted on Vercel — not just
// yours — make authenticated requests using a logged-in visitor's
// session cookie and read the response. That's session hijacking via
// CORS, not a hardening step. Anchoring the regex to a specific
// project-name prefix keeps the same convenience without opening the
// door to every other Vercel-hosted site on the internet.
const previewPrefix = process.env.CLIENT_ORIGIN_PREVIEW_PREFIX;
const previewOriginPattern = previewPrefix
  ? new RegExp(`^https://${previewPrefix}-[a-z0-9-]+\\.vercel\\.app$`)
  : null;

const corsOptionsDelegate = (origin, callback) => {
  // No Origin header at all — same-origin requests, curl, Postman,
  // Stripe's webhook (though that route is mounted before this
  // middleware anyway — see below), server-to-server calls. Not a
  // browser cross-origin request, so there's nothing for CORS to guard.
  if (!origin) return callback(null, true);

  const isAllowed = allowedOrigins.includes(origin) || previewOriginPattern?.test(origin);
  if (!isAllowed) {
    // Without this, a misconfigured CLIENT_ORIGIN just looks like every
    // request silently failing client-side (browsers hide the real
    // reason from JS) — this is the only server-side trace of which
    // origin got rejected and why, so check here first when a deployed
    // frontend can't reach the API at all.
    console.warn(`CORS: blocked request from origin "${origin}" — not in CLIENT_ORIGIN and no CLIENT_ORIGIN_PREVIEW_PREFIX match.`);
  }
  callback(isAllowed ? null : new Error('Blocked by CORS'), isAllowed);
};

app.use(helmet());
app.use(
  cors({
    origin: corsOptionsDelegate,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
// Stripe webhook: MUST be mounted before express.json(). Stripe's
// signature verification (see paymentController.handleWebhook) hashes
// the exact raw request body — if express.json() parses it into an
// object first, the raw bytes are gone and every signature check fails.
// Also bypasses apiLimiter/hpp/cookieParser below: this is a
// server-to-server call from Stripe, not a browser request, so none of
// those apply and the raw body must stay untouched by hpp too.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(hpp());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
