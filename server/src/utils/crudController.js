const asyncHandler = require('./asyncHandler');
const ApiError = require('./ApiError');

// Picks only the given keys out of `obj` (skipping ones that are
// undefined), so an extra field in the request body can't reach
// Model.create/update just because it happened to be present.
const pick = (obj, keys) => keys.reduce((acc, key) => {
  if (obj[key] !== undefined) acc[key] = obj[key];
  return acc;
}, {});

// serviceController, packageController, portfolioController, and
// freeToolController each independently implemented the same shape:
// a public list, an admin list (everything, including inactive/
// unpublished rows), create, update (404 if the id doesn't exist), and
// delete (404 if the id doesn't exist). Only the model, the method
// names, and what to call things in the JSON response actually
// differed between them — this factory is the one shared copy of that
// logic. Resource-specific extras (e.g. serviceController's
// getService-by-slug) stay in the individual controller files.
const buildCrudController = (Model, {
  entityLabel,            // e.g. 'Service' — used in 404 / delete messages
  singularKey,            // e.g. 'service' — response body key for one item
  pluralKey,               // e.g. 'services' — response body key for a list
  listMethod = 'listActive',
  listAdminMethod = 'listAllAdmin',
  listArgs,                // optional (req) => args passed to listMethod
  allowedFields,           // optional string[] — body keys create/update may pass to the model.
                           // The model's own create()/update() already destructure explicit
                           // fields, so this is defense-in-depth, not the only gate.
}) => {
  const list = asyncHandler(async (req, res) => {
    const items = await Model[listMethod](listArgs ? listArgs(req) : undefined);
    res.json({ success: true, [pluralKey]: items });
  });

  const listAdmin = asyncHandler(async (req, res) => {
    const items = await Model[listAdminMethod]();
    res.json({ success: true, [pluralKey]: items });
  });

  const create = asyncHandler(async (req, res) => {
    const body = allowedFields ? pick(req.body, allowedFields) : req.body;
    const item = await Model.create(body);
    res.status(201).json({ success: true, [singularKey]: item });
  });

  const update = asyncHandler(async (req, res) => {
    const body = allowedFields ? pick(req.body, allowedFields) : req.body;
    const item = await Model.update(req.params.id, body);
    if (!item) throw new ApiError(404, `${entityLabel} not found`);
    res.json({ success: true, [singularKey]: item });
  });

  const remove = asyncHandler(async (req, res) => {
    const item = await Model.remove(req.params.id);
    if (!item) throw new ApiError(404, `${entityLabel} not found`);
    res.json({ success: true, message: `${entityLabel} deleted` });
  });

  return { list, listAdmin, create, update, remove };
};

module.exports = buildCrudController;
