const pool = require('../db/pool');

const connectDB = async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  try {
    await pool.query('select 1');
    console.log('Postgres (Supabase) connected');
  } catch (err) {
    if (err.message && err.message.includes('self-signed certificate')) {
      console.error(
        '\n[Database TLS Error] Node.js rejected the Postgres TLS certificate: "self-signed certificate in certificate chain".\n'
        + 'Fix: Download your project CA cert from Supabase (Project Settings -> Database -> SSL Configuration -> "Download certificate")\n'
        + 'and set DATABASE_CA_CERT in server/.env (either path to the cert file or the PEM string).\n'
      );
    }
    throw err;
  }
};

module.exports = connectDB;
