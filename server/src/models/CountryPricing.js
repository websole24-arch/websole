const pool = require('../db/pool');
const buildUpdateSet = require('../db/buildUpdateSet');

// Used for statements with no table alias (insert/update/delete RETURNING,
// and simple selects with no join).
const COLUMNS = `
  id, country, country_code as "countryCode", currency,
  service_id as "service", package_id as "package", price, active,
  created_at as "createdAt", updated_at as "updatedAt"
`;

// Used only by the joined query below, where "cp" is the country_pricing alias.
const COLUMNS_POPULATED = `
  cp.id, cp.country, cp.country_code as "countryCode", cp.currency,
  cp.service_id as "service", cp.package_id as "package", cp.price, cp.active,
  cp.created_at as "createdAt", cp.updated_at as "updatedAt",
  json_build_object('_id', s.id, 'id', s.id, 'name', s.name, 'slug', s.slug, 'icon', s.icon) as "serviceRef",
  json_build_object('_id', pk.id, 'id', pk.id, 'name', pk.name, 'features', pk.features) as "packageRef"
`;

const populate = ({ serviceRef, packageRef, ...row }) => ({
  ...row,
  service: serviceRef,
  package: packageRef,
});

const find = async ({ country, service, package: pkg, active } = {}) => {
  const params = [];
  const where = [];
  if (country) { params.push(country); where.push(`cp.country = $${params.length}`); }
  if (service) { params.push(service); where.push(`cp.service_id = $${params.length}`); }
  if (pkg) { params.push(pkg); where.push(`cp.package_id = $${params.length}`); }
  if (active !== undefined) { params.push(active); where.push(`cp.active = $${params.length}`); }

  const { rows } = await pool.query(
    `select ${COLUMNS_POPULATED} from country_pricing cp
     join services s on s.id = cp.service_id
     join packages pk on pk.id = cp.package_id
     ${where.length ? `where ${where.join(' and ')}` : ''}`,
    params
  );
  return rows.map(populate);
};

// Admin-only — includes inactive rows (find() with no `active` filter still
// only returns rows where callers pass active:true, e.g. getPricing does).
const listAllAdmin = async () => {
  const { rows } = await pool.query(
    `select ${COLUMNS_POPULATED} from country_pricing cp
     join services s on s.id = cp.service_id
     join packages pk on pk.id = cp.package_id
     order by cp.country, s."order", pk."order"`
  );
  return rows.map(populate);
};

const findOneActive = async ({ country, service, package: pkg }) => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from country_pricing
     where active = true and country = $1 and service_id = $2 and package_id = $3
     limit 1`,
    [country, service, pkg]
  );
  return rows[0] || null;
};

const listCountries = async () => {
  const { rows } = await pool.query(
    `select distinct country from country_pricing where active = true order by country`
  );
  return rows.map((r) => r.country);
};

const findById = async (id) => {
  const { rows } = await pool.query(`select ${COLUMNS} from country_pricing where id = $1`, [id]);
  return rows[0] || null;
};

const create = async ({ country, countryCode, currency, service, package: pkg, price, active }) => {
  const { rows } = await pool.query(
    `insert into country_pricing (country, country_code, currency, service_id, package_id, price, active)
     values ($1, $2, $3, $4, $5, $6, coalesce($7, true))
     returning ${COLUMNS}`,
    [country, countryCode || null, currency, service, pkg, price, active]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const { sets, values } = buildUpdateSet({
    country: 'country', countryCode: 'country_code', currency: 'currency',
    service: 'service_id', package: 'package_id', price: 'price', active: 'active',
  }, fields);
  if (sets.length === 0) return findById(id);
  values.push(id);
  const { rows } = await pool.query(
    `update country_pricing set ${sets.join(', ')} where id = $${values.length} returning ${COLUMNS}`,
    values
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rows } = await pool.query('delete from country_pricing where id = $1 returning id', [id]);
  return rows[0] || null;
};

module.exports = {
  find, findOneActive, listCountries, listAllAdmin, findById, create, update, remove,
};
