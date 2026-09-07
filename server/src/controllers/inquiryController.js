const Inquiry = require('../models/Inquiry');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Field-level validation (required fields, email format, description
// length, etc.) happens in the createInquiryValidator middleware chain
// on the route — by the time a request reaches here it's already valid.
const createInquiry = asyncHandler(async (req, res) => {
  const {
    name, email, whatsapp, country, service, budget,
    description, referenceWebsite, preferredDeadline,
  } = req.body;

  const inquiry = await Inquiry.create({
    name, email, whatsapp, country, service, budget,
    description, referenceWebsite, preferredDeadline,
  });

  res.status(201).json({
    success: true,
    inquiry: { id: inquiry.id },
    message: 'Inquiry received. We will contact you shortly.',
  });
});

const listInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.listAll();
  res.json({ success: true, inquiries });
});

// Called when an admin opens an inquiry — marks it reviewed so it drops
// out of the sidebar's unread count. Separate from `status`, which is
// about where things stand with the customer, not who's seen it.
const viewInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.markViewed(req.params.id);
  if (!inquiry) throw new ApiError(404, 'Inquiry not found');
  res.json({ success: true, inquiry });
});

module.exports = { createInquiry, listInquiries, viewInquiry };
