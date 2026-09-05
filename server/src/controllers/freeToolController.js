const FreeToolLink = require('../models/FreeToolLink');
const buildCrudController = require('../utils/crudController');

const {
  list: listFreeTools,
  listAdmin: listFreeToolsAdmin,
  create: createFreeTool,
  update: updateFreeTool,
  remove: deleteFreeTool,
} = buildCrudController(FreeToolLink, {
  entityLabel: 'Free tool link',
  singularKey: 'tool',
  pluralKey: 'tools',
  allowedFields: ['label', 'href', 'isActive', 'order'],
});

module.exports = {
  listFreeTools, listFreeToolsAdmin, createFreeTool, updateFreeTool, deleteFreeTool,
};
