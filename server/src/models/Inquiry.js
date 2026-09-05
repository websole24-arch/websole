const pool = require('../db/pool');

const COLUMNS = `
  id, name, email, whatsapp, country, service, budget, description,
  reference_website as "referenceWebsite", preferred_deadline as "preferredDeadline",
  status, converted_to_project as "convertedToProject",
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

module.exports = { create, listAll };
