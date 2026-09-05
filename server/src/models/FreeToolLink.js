const pool = require('../db/pool');
const buildUpdateSet = require('../db/buildUpdateSet');

const COLUMNS = `
  id, label, href, is_active as "isActive", "order",
  created_at as "createdAt", updated_at as "updatedAt"
`;

// Public feed — active links only, in admin-defined order. Powers the site
// Footer's "Free Tools" column.
const listActive = async () => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from free_tool_links where is_active = true order by "order", created_at`
  );
  return rows;
};

// Admin-only — includes inactive links, so a hidden link doesn't disappear
// from the management screen (listActive filters is_active=true).
const listAllAdmin = async () => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from free_tool_links order by "order", created_at`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`select ${COLUMNS} from free_tool_links where id = $1`, [id]);
  return rows[0] || null;
};

const create = async ({ label, href, isActive, order }) => {
  const { rows } = await pool.query(
    `insert into free_tool_links (label, href, is_active, "order")
     values ($1, $2, coalesce($3, true), coalesce($4, 0))
     returning ${COLUMNS}`,
    [label, href, isActive, order]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const { sets, values } = buildUpdateSet({
    label: 'label', href: 'href', isActive: 'is_active', order: '"order"',
  }, fields);
  if (sets.length === 0) return findById(id);
  values.push(id);
  const { rows } = await pool.query(
    `update free_tool_links set ${sets.join(', ')} where id = $${values.length} returning ${COLUMNS}`,
    values
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rows } = await pool.query('delete from free_tool_links where id = $1 returning id', [id]);
  return rows[0] || null;
};

module.exports = { listActive, listAllAdmin, findById, create, update, remove };
