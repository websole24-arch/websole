require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const run = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set — check server/.env');
    process.exit(1);
  }
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Schema applied to', new URL(process.env.DATABASE_URL).host);
  await pool.end();
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
