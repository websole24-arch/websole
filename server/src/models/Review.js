const pool = require('../db/pool');

const COLUMNS = `
  id, user_id as "userId", name, country, service, rating, comment, approved,
  created_at as "createdAt", updated_at as "updatedAt"
`;

// name/country come from the submitting user's own profile, not the
// request body — see schema.sql comment on the reviews table.
const create = async ({ userId, name, country, service, rating, comment }) => {
  const { rows } = await pool.query(
    `insert into reviews (user_id, name, country, service, rating, comment)
     values ($1, $2, $3, $4, $5, $6)
     returning ${COLUMNS}`,
    [userId, name, country || null, service || null, rating, comment]
  );
  return rows[0];
};

// Public feed — approved only.
const listApproved = async () => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from reviews where approved = true order by created_at desc`
  );
  return rows;
};

// Admin-only — every review, pending and approved.
const listAllAdmin = async () => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from reviews order by created_at desc`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`select ${COLUMNS} from reviews where id = $1`, [id]);
  return rows[0] || null;
};

const findByUser = async (userId) => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from reviews where user_id = $1 order by created_at desc limit 1`,
    [userId]
  );
  return rows[0] || null;
};

const setApproved = async (id, approved) => {
  const { rows } = await pool.query(
    `update reviews set approved = $2 where id = $1 returning ${COLUMNS}`,
    [id, approved]
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rows } = await pool.query('delete from reviews where id = $1 returning id', [id]);
  return rows[0] || null;
};

module.exports = { create, listApproved, listAllAdmin, findById, findByUser, setApproved, remove };
