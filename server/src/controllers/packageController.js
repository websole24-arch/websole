const Package = require('../models/Package');
const buildCrudController = require('../utils/crudController');

const {
  list: listPackages,
  listAdmin: listPackagesAdmin,
  create: createPackage,
  update: updatePackage,
  remove: deletePackage,
} = buildCrudController(Package, {
  entityLabel: 'Package',
  singularKey: 'package',
  pluralKey: 'packages',
  listArgs: (req) => ({ service: req.query.service }),
  allowedFields: ['service', 'name', 'description', 'features', 'isActive', 'order'],
});

module.exports = { listPackages, listPackagesAdmin, createPackage, updatePackage, deletePackage };
