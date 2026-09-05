const pool = require('../db/pool');
const buildUpdateSet = require('../db/buildUpdateSet');

const COLUMNS = `
  id, service_id as "service", name, description, features,
  is_active as "isActive", "order",
  created_at as "createdAt", updated_at as "updatedAt"
`;

const COLUMNS_WITH_SERVICE = `
  p.id, p.service_id as "service", p.name, p.description, p.features,
  p.is_active as "isActive", p."order",
  p.created_at as "createdAt", p.updated_at as "updatedAt",
  json_build_object('_id', s.id, 'id', s.id, 'name', s.name, 'slug', s.slug) as "serviceRef"
`;

const listActive = async ({ service } = {}) => {
  const params = [];
  let where = 'p.is_active = true';
  if (service) {
    params.push(service);
    where += ` and p.service_id = $${params.length}`;
  }
  const { rows } = await pool.query(
    `select ${COLUMNS_WITH_SERVICE} from packages p
     join services s on s.id = p.service_id
     where ${where}
     order by p."order"`,
    params
  );
  // Shape "service" as a nested object, matching what the old Mongoose
  // .populate('service') response looked like — keeps the client unchanged.
  return rows.map(({ serviceRef, ...pkg }) => ({ ...pkg, service: serviceRef }));
};

// Admin-only — includes inactive packages (listActive filters is_active=true).
const listAllAdmin = async () => {
  const { rows } = await pool.query(
    `select ${COLUMNS_WITH_SERVICE} from packages p
     join services s on s.id = p.service_id
     order by s."order", p."order"`
  );
  return rows.map(({ serviceRef, ...pkg }) => ({ ...pkg, service: serviceRef }));
};

const findById = async (id) => {
  const { rows } = await pool.query(`select ${COLUMNS} from packages where id = $1`, [id]);
  return rows[0] || null;
};

const create = async ({ service, name, description, features, isActive, order }) => {
  const { rows } = await pool.query(
    `insert into packages (service_id, name, description, features, is_active, "order")
     values ($1, $2, $3, $4, coalesce($5, true), coalesce($6, 0))
     returning ${COLUMNS}`,
    [service, name, description || null, features || [], isActive, order]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const { sets, values } = buildUpdateSet({
    service: 'service_id', name: 'name', description: 'description',
    features: 'features', isActive: 'is_active', order: '"order"',
  }, fields);
  if (sets.length === 0) return findById(id);
  values.push(id);
  const { rows } = await pool.query(
    `update packages set ${sets.join(', ')} where id = $${values.length} returning ${COLUMNS}`,
    values
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rows } = await pool.query('delete from packages where id = $1 returning id', [id]);
  return rows[0] || null;
};

module.exports = { listActive, listAllAdmin, findById, create, update, remove };
