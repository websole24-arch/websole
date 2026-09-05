const pool = require('../db/pool');
const buildUpdateSet = require('../db/buildUpdateSet');

const COLUMNS = `
  id, title, description, service, country,
  image_url as "imageUrl", project_url as "projectUrl",
  completed_on as "completedOn", published,
  tech_stack as "techStack", features,
  created_at as "createdAt", updated_at as "updatedAt"
`;

// Public feed — published only, most recently completed first (rows with
// no completion date sort last rather than first).
const listPublished = async () => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from portfolio_projects
     where published = true
     order by completed_on desc nulls last, created_at desc`
  );
  return rows;
};

// Admin-only — every row, published and unpublished.
const listAllAdmin = async () => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from portfolio_projects order by created_at desc`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `select ${COLUMNS} from portfolio_projects where id = $1`, [id]
  );
  return rows[0] || null;
};

const create = async ({
  title, description, service, country, imageUrl, projectUrl, completedOn, published,
  techStack, features,
}) => {
  const { rows } = await pool.query(
    `insert into portfolio_projects
       (title, description, service, country, image_url, project_url, completed_on, published,
        tech_stack, features)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     returning ${COLUMNS}`,
    [
      title, description, service || null, country || null,
      imageUrl || null, projectUrl || null, completedOn || null, Boolean(published),
      techStack || [], features || [],
    ]
  );
  return rows[0];
};

// Partial update — only fields present in `fields` are changed.
const update = async (id, fields) => {
  const { sets, values } = buildUpdateSet({
    title: 'title', description: 'description', service: 'service', country: 'country',
    imageUrl: 'image_url', projectUrl: 'project_url', completedOn: 'completed_on',
    published: 'published', techStack: 'tech_stack', features: 'features',
  }, fields);
  if (sets.length === 0) return findById(id);

  values.push(id);
  const { rows } = await pool.query(
    `update portfolio_projects set ${sets.join(', ')} where id = $${values.length} returning ${COLUMNS}`,
    values
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rows } = await pool.query(
    'delete from portfolio_projects where id = $1 returning id', [id]
  );
  return rows[0] || null;
};

module.exports = { listPublished, listAllAdmin, findById, create, update, remove };
