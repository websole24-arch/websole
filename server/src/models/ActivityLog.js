const pool = require('../db/pool');

const COLUMNS = `
  id, project_id as "project", actor_id as "actor", action, meta,
  created_at as "createdAt", updated_at as "updatedAt"
`;

const create = async ({ project, actor, action, meta }) => {
  const { rows } = await pool.query(
    `insert into activity_logs (project_id, actor_id, action, meta)
     values ($1, $2, $3, $4)
     returning ${COLUMNS}`,
    [project || null, actor || null, action, meta ? JSON.stringify(meta) : null]
  );
  return rows[0];
};

const findForProject = async (projectId) => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from activity_logs where project_id = $1 order by created_at desc`,
    [projectId]
  );
  return rows;
};

module.exports = { create, findForProject };
