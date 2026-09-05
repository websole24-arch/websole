const pool = require('../db/pool');
const buildUpdateSet = require('../db/buildUpdateSet');

const COLUMNS = `
  id, name, slug, short_description as "shortDescription", description,
  examples, icon, is_active as "isActive", "order",
  created_at as "createdAt", updated_at as "updatedAt"
`;

const listActive = async () => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from services where is_active = true order by "order"`
  );
  return rows;
};

// Admin-only — includes inactive services, so a disabled service doesn't
// disappear from the management screen (listActive filters is_active=true).
const listAllAdmin = async () => {
  const { rows } = await pool.query(`select ${COLUMNS} from services order by "order"`);
  return rows;
};

const findBySlug = async (slug) => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from services where slug = $1 and is_active = true`,
    [slug]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await pool.query(`select ${COLUMNS} from services where id = $1`, [id]);
  return rows[0] || null;
};

const create = async ({ name, slug, shortDescription, description, examples, icon, isActive, order }) => {
  const { rows } = await pool.query(
    `insert into services (name, slug, short_description, description, examples, icon, is_active, "order")
     values ($1, $2, $3, $4, $5, $6, coalesce($7, true), coalesce($8, 0))
     returning ${COLUMNS}`,
    [name, slug, shortDescription, description, examples || [], icon || null, isActive, order]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const { sets, values } = buildUpdateSet({
    name: 'name', slug: 'slug', shortDescription: 'short_description', description: 'description',
    examples: 'examples', icon: 'icon', isActive: 'is_active', order: '"order"',
  }, fields);
  if (sets.length === 0) return findById(id);
  values.push(id);
  const { rows } = await pool.query(
    `update services set ${sets.join(', ')} where id = $${values.length} returning ${COLUMNS}`,
    values
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rows } = await pool.query('delete from services where id = $1 returning id', [id]);
  return rows[0] || null;
};

module.exports = { listActive, listAllAdmin, findBySlug, findById, create, update, remove };
