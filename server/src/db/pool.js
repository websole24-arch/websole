const { Pool, types } = require('pg');

// Postgres NUMERIC (oid 1700) comes back as a string by default, to avoid
// float precision loss on huge values. This app only stores money amounts
// at normal magnitudes, so parse it as a number — callers (controllers,
// the client's .toLocaleString() calls) expect a JS number here.
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

if (!process.env.DATABASE_URL) {
  // Thrown at connectDB() time in normal runs; module load must stay safe for tests.
  // eslint-disable-next-line no-console
  console.warn('DATABASE_URL is not set — Postgres calls will fail until it is.');
}

const isLocal = (process.env.DATABASE_URL || '').includes('localhost')
  || (process.env.DATABASE_URL || '').includes('127.0.0.1');

// TLS certificate validation for the Postgres connection (CWE-295).
// - Local Postgres (localhost / 127.0.0.1): TLS is typically not configured,
//   so we skip it entirely.
// - Remote Postgres with DATABASE_CA_CERT set: use the supplied CA PEM for
//   strict verification. Supabase: Project Settings → Database → SSL
//   Configuration → "Download certificate". Some env-var UIs collapse real
//   newlines, so we also accept the PEM with literal "\n" escapes.
// - Remote Postgres without DATABASE_CA_CERT: rely on Node's built-in trust
//   store with rejectUnauthorized: true (secure default). If the server's
//   certificate is from a publicly trusted CA (e.g. Supabase pooler), this
//   will work without any extra configuration.
//
// There is NO escape hatch to disable certificate validation. If you see
// "self-signed certificate in certificate chain", supply DATABASE_CA_CERT
// instead of disabling TLS verification.
const fs = require('fs');

const buildSsl = () => {
  if (isLocal) return false; // local Postgres during dev usually has no TLS listener at all

  const caCert = process.env.DATABASE_CA_CERT;
  if (caCert) {
    let ca = caCert;
    // Support either a file path to the cert or an inline PEM string
    if (fs.existsSync(caCert)) {
      ca = fs.readFileSync(caCert, 'utf8');
    } else if (caCert.includes('\\n')) {
      ca = caCert.replace(/\\n/g, '\n');
    }
    return { ca, rejectUnauthorized: true };
  }

  // No CA supplied — rely on Node's built-in trust store.
  // rejectUnauthorized defaults to true in Node's tls module.
  return { rejectUnauthorized: true };
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: buildSsl(),
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle Postgres client:', err.message);
});

module.exports = pool;