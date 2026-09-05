const pool = require('../db/pool');

const STATUSES = [
  'Inquiry', 'Awaiting Payment', 'Payment Confirmed', 'Project Started',
  'Design', 'Development', 'Review', 'Revision', 'Final Payment',
  'Final Delivery', 'Completed', 'Closed',
];

const COLUMNS = `
  p.id, p.customer_id as "customer", p.service_id as "service", p.package_id as "package",
  p.country, p.currency, p.total_amount as "totalAmount", p.advance_amount as "advanceAmount",
  p.remaining_amount as "remainingAmount", p.status, p.requirements,
  p.start_date as "startDate", p.expected_completion_date as "expectedCompletionDate",
  p.created_by_admin as "createdByAdmin",
  p.created_at as "createdAt", p.updated_at as "updatedAt"
`;

// Plain (unprefixed) — for insert/update RETURNING, where there's no "p" alias.
const PLAIN_COLUMNS = `
  id, customer_id as "customer", service_id as "service", package_id as "package",
  country, currency, total_amount as "totalAmount", advance_amount as "advanceAmount",
  remaining_amount as "remainingAmount", status, requirements,
  start_date as "startDate", expected_completion_date as "expectedCompletionDate",
  created_by_admin as "createdByAdmin",
  created_at as "createdAt", updated_at as "updatedAt"
`;

const COLUMNS_POPULATED = `
  ${COLUMNS},
  json_build_object('_id', s.id, 'id', s.id, 'name', s.name, 'slug', s.slug) as "serviceRef",
  json_build_object('_id', pk.id, 'id', pk.id, 'name', pk.name, 'features', pk.features) as "packageRef",
  json_build_object('_id', u.id, 'id', u.id, 'name', u.name, 'email', u.email) as "customerRef",
  exists(
    select 1 from payments pay
    where pay.project_id = p.id and pay.type = 'advance' and pay.status = 'Paid'
  ) as "advancePaid"
`;

const populate = ({ serviceRef, packageRef, customerRef, ...row }) => ({
  ...row,
  service: serviceRef,
  package: packageRef,
  customer: customerRef,
});

const baseQuery = `
  select ${COLUMNS_POPULATED} from projects p
  join services s on s.id = p.service_id
  join packages pk on pk.id = p.package_id
  join users u on u.id = p.customer_id
`;

const create = async ({
  customer, service, package: pkg, country, currency,
  totalAmount, advanceAmount, remainingAmount, status, requirements,
}) => {
  const { rows } = await pool.query(
    `insert into projects
       (customer_id, service_id, package_id, country, currency,
        total_amount, advance_amount, remaining_amount, status, requirements)
     values ($1, $2, $3, $4, $5, $6, $7, $8, coalesce($9, 'Inquiry'), $10)
     returning ${PLAIN_COLUMNS}`,
    [customer, service, pkg, country, currency, totalAmount, advanceAmount, remainingAmount, status, requirements || null]
  );
  return rows[0];
};

const findAllForCustomer = async (customerId) => {
  const { rows } = await pool.query(
    `${baseQuery} where p.customer_id = $1 order by p.created_at desc`,
    [customerId]
  );
  return rows.map(populate);
};

const findAllForAdmin = async () => {
  const { rows } = await pool.query(`${baseQuery} order by p.created_at desc`);
  return rows.map(populate);
};

const findById = async (id) => {
  const { rows } = await pool.query(`${baseQuery} where p.id = $1`, [id]);
  return rows[0] ? populate(rows[0]) : null;
};

const updateStatus = async (id, status) => {
  const { rows } = await pool.query(
    `update projects set status = $1 where id = $2 returning ${PLAIN_COLUMNS}`,
    [status, id]
  );
  return rows[0] || null;
};

// Existence check, not a full row fetch — backs the "only customers with
// a finished project can leave a review" rule in reviewController.js.
// Deliberately just 'Completed', not 'Closed' too — 'Closed' can also
// mean an inquiry/project that was abandoned or cancelled before
// delivery, which isn't something to solicit a review for.
const hasCompletedProject = async (customerId) => {
  const { rows } = await pool.query(
    `select 1 from projects where customer_id = $1 and status = 'Completed' limit 1`,
    [customerId]
  );
  return rows.length > 0;
};

module.exports = {
  STATUSES, create, findAllForCustomer, findAllForAdmin, findById, updateStatus, hasCompletedProject,
};
