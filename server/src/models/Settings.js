const pool = require('../db/pool');

const COLUMNS = `
  stripe_payments_enabled as "stripePaymentsEnabled",
  whatsapp_payments_enabled as "whatsappPaymentsEnabled",
  updated_at as "updatedAt"
`;

// Singleton row (id is always TRUE — enforced in schema.sql's check
// constraint). schema.sql also seeds this row on migrate, so `get`
// should always find exactly one — the `|| DEFAULTS` fallback only
// matters if someone's DB predates this table and hasn't re-migrated.
const DEFAULTS = { stripePaymentsEnabled: true, whatsappPaymentsEnabled: true };

const get = async () => {
  const { rows } = await pool.query(`select ${COLUMNS} from settings where id = true`);
  return rows[0] || DEFAULTS;
};

// Partial update — only touches the keys actually passed, so admin can
// toggle one without needing to resend the other.
const update = async ({ stripePaymentsEnabled, whatsappPaymentsEnabled }) => {
  const { rows } = await pool.query(
    `update settings set
       stripe_payments_enabled = coalesce($1, stripe_payments_enabled),
       whatsapp_payments_enabled = coalesce($2, whatsapp_payments_enabled)
     where id = true
     returning ${COLUMNS}`,
    [stripePaymentsEnabled, whatsappPaymentsEnabled]
  );
  return rows[0];
};

module.exports = { get, update };
