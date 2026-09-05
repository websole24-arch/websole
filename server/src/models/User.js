// Profile data for a Supabase Auth user — credentials/sessions are
// Supabase's responsibility now (see DECISIONS.md). "id" here always
// equals the corresponding auth.users.id.
const pool = require('../db/pool');
const buildUpdateSet = require('../db/buildUpdateSet');

const COLUMNS = `
  id, name, email, phone, country, company_name as "companyName",
  role, is_active as "isActive", email_verified as "emailVerified",
  created_at as "createdAt", updated_at as "updatedAt"
`;

const createProfile = async ({ id, name, email, phone, country, companyName, role, isActive, emailVerified }) => {
  const { rows } = await pool.query(
    `insert into users (id, name, email, phone, country, company_name, role, is_active, email_verified)
     values ($1, $2, $3, $4, $5, $6, coalesce($7, 'customer'), coalesce($8, true), coalesce($9, false))
     returning ${COLUMNS}`,
    [id, name, email, phone || null, country || null, companyName || null, role, isActive, emailVerified]
  );
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await pool.query(`select ${COLUMNS} from users where id = $1`, [id]);
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const { rows } = await pool.query(`select ${COLUMNS} from users where email = $1`, [email]);
  return rows[0] || null;
};

// Admin-only — every profile (customers + admins), newest first.
const listAll = async () => {
  const { rows } = await pool.query(`select ${COLUMNS} from users order by created_at desc`);
  return rows;
};

// Admin-only for isActive/role (enable/disable an account, promote/demote).
// Name/email/phone/country stay customer-editable-only for now (no admin
// profile-edit UI yet — see TODO.md). emailVerified is set exactly once,
// by verifyEmail in authController after Supabase confirms the address —
// never client-editable, so it isn't exposed on any admin-facing route.
const update = async (id, fields) => {
  const { sets, values } = buildUpdateSet(
    { isActive: 'is_active', role: 'role', emailVerified: 'email_verified' },
    fields
  );
  if (sets.length === 0) return findById(id);
  values.push(id);
  const { rows } = await pool.query(
    `update users set ${sets.join(', ')} where id = $${values.length} returning ${COLUMNS}`,
    values
  );
  return rows[0] || null;
};

module.exports = { createProfile, findById, findByEmail, listAll, update };
