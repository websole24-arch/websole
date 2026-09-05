// Wired up (Session 14) — see fileController.js. Storage itself is
// Supabase Storage (server/src/lib/supabase.js's admin client); this
// model only ever touches the metadata row in Postgres.
const pool = require('../db/pool');

const CATEGORIES = ['Brief', 'Payment Slip', 'Design', 'Development', 'Preview', 'Documents', 'Final Delivery'];

const COLUMNS = `
  id, project_id as "project", uploaded_by as "uploadedBy", category,
  original_name as "originalName", stored_name as "storedName",
  mime_type as "mimeType", size, download_count as "downloadCount",
  created_at as "createdAt", updated_at as "updatedAt"
`;

const create = async ({ project, uploadedBy, category, originalName, storedName, mimeType, size }) => {
  const { rows } = await pool.query(
    `insert into project_files
       (project_id, uploaded_by, category, original_name, stored_name, mime_type, size)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning ${COLUMNS}`,
    [project, uploadedBy, category, originalName, storedName, mimeType, size]
  );
  return rows[0];
};

const findAllForProject = async (projectId) => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from project_files where project_id = $1 order by created_at desc`,
    [projectId]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`select ${COLUMNS} from project_files where id = $1`, [id]);
  return rows[0] || null;
};

const incrementDownloadCount = async (id) => {
  await pool.query(`update project_files set download_count = download_count + 1 where id = $1`, [id]);
};

const remove = async (id) => {
  await pool.query(`delete from project_files where id = $1`, [id]);
};

module.exports = { CATEGORIES, create, findAllForProject, findById, incrementDownloadCount, remove };
