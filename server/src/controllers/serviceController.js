const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const buildCrudController = require('../utils/crudController');

const {
  list: listServices,
  listAdmin: listServicesAdmin,
  create: createService,
  update: updateService,
  remove: deleteService,
} = buildCrudController(Service, {
  entityLabel: 'Service',
  singularKey: 'service',
  pluralKey: 'services',
  allowedFields: ['name', 'slug', 'shortDescription', 'description', 'examples', 'icon', 'isActive', 'order'],
});

const getService = asyncHandler(async (req, res) => {
  const service = await Service.findBySlug(req.params.slug);
  if (!service) throw new ApiError(404, 'Service not found');
  res.json({ success: true, service });
});

module.exports = {
  listServices, getService, listServicesAdmin, createService, updateService, deleteService,
};
