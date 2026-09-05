// Schema-only for now — no controller wires this up yet (see TODO.md).
const pool = require('../db/pool');

const COLUMNS = `
  id, user_id as "user", type, title, message, project_id as "project",
  is_read as "isRead", created_at as "createdAt", updated_at as "updatedAt"
`;

const create = async ({ user, type, title, message, project }) => {
  const { rows } = await pool.query(
    `insert into notifications (user_id, type, title, message, project_id)
     values ($1, $2, $3, $4, $5)
     returning ${COLUMNS}`,
    [user, type, title, message, project || null]
  );
  return rows[0];
};

module.exports = { create };
