const Settings = require('../models/Settings');
const asyncHandler = require('../utils/asyncHandler');

// Public on purpose: the client needs this on every page load (before a
// customer is even logged in, e.g. to decide whether to show a WhatsApp
// CTA) to decide what to render — it's a display toggle, not sensitive
// data, so there's no reason to gate it behind auth the way the write
// side (below) is.
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.get();
  res.json({ success: true, settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.update(req.body);
  res.json({ success: true, settings });
});

module.exports = { getSettings, updateSettings };
