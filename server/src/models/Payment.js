// Stripe integration wired up (Session 14) — see paymentController.js and
// routes/paymentRoutes.js. Checkout Session creation + webhook sync both
// go through this model.
const pool = require('../db/pool');

const COLUMNS = `
  id, project_id as "project", type, amount, currency, provider,
  provider_payment_id as "providerPaymentId", status, paid_at as "paidAt",
  created_at as "createdAt", updated_at as "updatedAt"
`;

const create = async ({ project, type, amount, currency, provider, providerPaymentId, status }) => {
  const { rows } = await pool.query(
    `insert into payments (project_id, type, amount, currency, provider, provider_payment_id, status)
     values ($1, $2, $3, $4, coalesce($5, 'stripe'), $6, coalesce($7, 'Pending'))
     returning ${COLUMNS}`,
    [project, type, amount, currency, provider, providerPaymentId || null, status]
  );
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await pool.query(`select ${COLUMNS} from payments where id = $1`, [id]);
  return rows[0] || null;
};

// One row per {project, type} is the working assumption (a project has at
// most one 'advance' and one 'final' payment in flight at a time) — used
// to find an existing Pending row to reuse/replace before minting a new
// Checkout Session, and to check "has this already been paid" before
// gating a status transition.
const findByProjectAndType = async (projectId, type) => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from payments where project_id = $1 and type = $2
     order by created_at desc limit 1`,
    [projectId, type]
  );
  return rows[0] || null;
};

const findAllForProject = async (projectId) => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from payments where project_id = $1 order by created_at desc`,
    [projectId]
  );
  return rows;
};

const findByProviderPaymentId = async (providerPaymentId) => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from payments where provider_payment_id = $1`,
    [providerPaymentId]
  );
  return rows[0] || null;
};

const updateStatus = async (id, { status, paidAt }) => {
  const { rows } = await pool.query(
    `update payments set status = $1, paid_at = coalesce($2, paid_at) where id = $3
     returning ${COLUMNS}`,
    [status, paidAt || null, id]
  );
  return rows[0] || null;
};

// Re-points an existing (Pending) row at a freshly-minted Stripe Checkout
// Session — used when a customer re-opens checkout for a project/type
// that already has an unpaid attempt, instead of piling up duplicate rows.
const repointToSession = async (id, providerPaymentId) => {
  const { rows } = await pool.query(
    `update payments set provider_payment_id = $1, status = 'Pending' where id = $2
     returning ${COLUMNS}`,
    [providerPaymentId, id]
  );
  return rows[0] || null;
};

// Existence check backing the "Project Started" gate in projectController —
// a project can only move forward once its advance payment is Paid.
const hasPaidAdvance = async (projectId) => {
  const { rows } = await pool.query(
    `select 1 from payments where project_id = $1 and type = 'advance' and status = 'Paid' limit 1`,
    [projectId]
  );
  return rows.length > 0;
};

module.exports = {
  create, findById, findByProjectAndType, findAllForProject,
  findByProviderPaymentId, updateStatus, repointToSession, hasPaidAdvance,
};
