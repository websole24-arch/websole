const Project = require('../models/Project');
const CountryPricing = require('../models/CountryPricing');
const ActivityLog = require('../models/ActivityLog');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const isOwner = require('../utils/isProjectOwner');

const FALLBACK_COUNTRY = 'International';

const findPricingRow = async (country, service, pkg) => {
  let row = await CountryPricing.findOneActive({ country, service, package: pkg });
  if (!row && country !== FALLBACK_COUNTRY) {
    row = await CountryPricing.findOneActive({ country: FALLBACK_COUNTRY, service, package: pkg });
  }
  return row;
};

const createProject = asyncHandler(async (req, res) => {
  const { service, package: pkg, country, requirements } = req.body;

  const pricingRow = await findPricingRow(country, service, pkg);
  if (!pricingRow) {
    throw new ApiError(400, 'No active pricing found for that service/package/country');
  }

  const totalAmount = Number(pricingRow.price);
  const advanceAmount = Math.round((totalAmount / 2) * 100) / 100;
  const remainingAmount = totalAmount - advanceAmount;

  const project = await Project.create({
    customer: req.user.id,
    service,
    package: pkg,
    country,
    currency: pricingRow.currency,
    totalAmount,
    advanceAmount,
    remainingAmount,
    status: 'Awaiting Payment',
    requirements,
  });

  await ActivityLog.create({
    project: project.id,
    actor: req.user.id,
    action: 'Project created',
    meta: { status: project.status },
  });

  res.status(201).json({ success: true, project });
});

const listProjects = asyncHandler(async (req, res) => {
  const projects = req.user.role === 'admin'
    ? await Project.findAllForAdmin()
    : await Project.findAllForCustomer(req.user.id);

  res.json({ success: true, projects });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) throw new ApiError(404, 'Project not found');
  if (!isOwner(project, req.user)) throw new ApiError(403, 'Not authorized for this project');

  const payments = await Payment.findAllForProject(project.id);
  res.json({ success: true, project, payments });
});

const updateProjectStatus = asyncHandler(async (req, res) => {
  const existing = await Project.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Project not found');

  const fromStatus = existing.status;
  const { status } = req.body;

  // Payment gate: an admin can't push a project past the point where work
  // actually starts until the 50% advance is confirmed Paid. This was a
  // schema-only rule before Stripe was wired up (see TODO.md) — enforced
  // here rather than in the DB so the error message stays friendly.
  if (status === 'Project Started' && !(await Payment.hasPaidAdvance(existing.id))) {
    throw new ApiError(400, 'Cannot start the project until the 50% advance payment is confirmed Paid');
  }

  const project = await Project.updateStatus(req.params.id, status);

  await ActivityLog.create({
    project: project.id,
    actor: req.user.id,
    action: 'Status changed',
    meta: { from: fromStatus, to: status },
  });

  res.json({ success: true, project });
});

module.exports = { createProject, listProjects, getProject, updateProjectStatus };
