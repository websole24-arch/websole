// Fail fast, loudly, at boot — instead of the app "starting successfully"
// (health check green, unrelated routes working fine) and then every
// POST /auth/login or /auth/register 500ing with a generic "Something
// went wrong" the moment it first touches Supabase.
//
// Why this was needed: DATABASE_URL is already checked before the server
// starts accepting traffic (config/db.js — connectDB() runs a real query
// at boot). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_JWT_SECRET
// were NOT — lib/supabase.js's getSupabaseAdmin() only threw the first time
// something actually called it, which for a fresh visitor is their login
// attempt. That throw isn't an ApiError, so middleware/errorHandler.js
// (correctly) hides the real reason behind a generic 500 for the client,
// while logging the true error server-side via console.error — visible in
// Railway/Render's logs, but easy to miss if you're only looking at the
// browser network tab. This check turns "silently 500ing on every login"
// into "won't boot, with a log line telling you exactly what to set."
const REQUIRED_VARS = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
];

const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key] || !process.env[key].trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}.\n`
      + 'The app cannot handle registration/login without these. Set them in your '
      + 'host\'s dashboard (Railway: your service -> Variables tab; Render: your '
      + 'service -> Environment) and redeploy. See DEPLOYMENT.md section 1 for where '
      + 'each value comes from (Supabase dashboard -> Project Settings -> API / Database).'
    );
  }

  // A present-but-malformed SUPABASE_URL (typo, stray quotes, missing
  // "https://", trailing space copied from the dashboard) makes
  // @supabase/supabase-js's createClient() throw synchronously the first
  // time getSupabaseAdmin() runs — same silent-500-on-login symptom as a
  // missing value. Catch it here too, with the actual value in the message.
  try {
    // eslint-disable-next-line no-new
    new URL(process.env.SUPABASE_URL);
  } catch {
    throw new Error(
      `SUPABASE_URL is not a valid URL: "${process.env.SUPABASE_URL}". `
      + 'Copy it fresh from Supabase dashboard -> Project Settings -> API -> Project URL '
      + '(watch for stray quotes or trailing spaces/newlines pasted in from the dashboard).'
    );
  }
};

module.exports = validateEnv;
