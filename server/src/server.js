require('dotenv').config();

// NODE_ENV isn't set by most hosts automatically — unlike, say, PORT,
// which platforms inject for you. Left unset, it silently falls through
// every `NODE_ENV === 'production'` / `!== 'test'` check in this app as
// "not production" — e.g. sessionCookies.js keeps SameSite=Lax instead
// of None, which breaks cookie delivery entirely on a cross-domain
// deploy (client on Vercel, API on Railway/Render — see
// ARCHITECTURE.md). This won't catch every misconfiguration, but it
// turns "silently broken in prod" into a loud, obvious log line at boot.
if (!process.env.NODE_ENV) {
  console.warn(
    'WARNING: NODE_ENV is not set. Defaulting to development-like behavior '
    + '(cookies without SameSite=None/Secure, verbose error stacks). '
    + 'Set NODE_ENV=production explicitly on any real deployment — most hosts do not do this for you.'
  );
}

const app = require('./app');
const connectDB = require('./config/db');
const validateEnv = require('./config/validateEnv');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    validateEnv();
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
