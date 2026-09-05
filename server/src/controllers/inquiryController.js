const Inquiry = require('../models/Inquiry');
const asyncHandler = require('../utils/asyncHandler');

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

module.exports = { createInquiry, listInquiries };
