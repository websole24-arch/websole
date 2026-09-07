const pool = require('../db/pool');

const COLUMNS = `
  id, name, email, whatsapp, country, service, budget, description,
  reference_website as "referenceWebsite", preferred_deadline as "preferredDeadline",
  status, converted_to_project as "convertedToProject", viewed_at as "viewedAt",
  created_at as "createdAt", updated_at as "updatedAt"
`;

const create = async ({
  name, email, whatsapp, country, service, budget,
  description, referenceWebsite, preferredDeadline,
}) => {
  const { rows } = await pool.query(
    `insert into inquiries
       (name, email, whatsapp, country, service, budget, description, reference_website, preferred_deadline)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning ${COLUMNS}`,
    [name, email, whatsapp || null, country || null, service, budget || null,
      description, referenceWebsite || null, preferredDeadline || null]
  );
  return rows[0];
};

const listAll = async () => {
  const { rows } = await pool.query(`select ${COLUMNS} from inquiries order by created_at desc`);
  return rows;
};

// Idempotent: only sets viewed_at the first time, so re-opening an
// already-reviewed inquiry doesn't touch its timestamp.
const markViewed = async (id) => {
  const { rows } = await pool.query(
    `update inquiries set viewed_at = coalesce(viewed_at, now())
     where id = $1
     returning ${COLUMNS}`,
    [id]
  );
  return rows[0];
};

module.exports = { create, listAll, markViewed };
