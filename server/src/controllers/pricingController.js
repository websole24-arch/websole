const CountryPricing = require('../models/CountryPricing');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const FALLBACK_COUNTRY = 'International';

const getPricing = asyncHandler(async (req, res) => {
  const { country, service, package: pkg } = req.query;
  const targetCountry = country || FALLBACK_COUNTRY;

  let entries = await CountryPricing.find({
    active: true, country: targetCountry, service, package: pkg,
  });

  let usedFallback = false;
  if (entries.length === 0 && targetCountry !== FALLBACK_COUNTRY) {
    entries = await CountryPricing.find({
      active: true, country: FALLBACK_COUNTRY, service, package: pkg,
    });
    usedFallback = true;
  }

  res.json({ success: true, country: targetCountry, usedFallback, pricing: entries });
});

const listCountries = asyncHandler(async (req, res) => {
  const countries = await CountryPricing.listCountries();
  res.json({ success: true, countries });
});

// Admin-only — includes inactive rows (getPricing always filters active:true).
const listPricingAdmin = asyncHandler(async (req, res) => {
  const pricing = await CountryPricing.listAllAdmin();
  res.json({ success: true, pricing });
});

const createPricing = asyncHandler(async (req, res) => {
  const { country, countryCode, currency, service, package: pkg, price, active } = req.body;
  const entry = await CountryPricing.create({
    country, countryCode, currency, service, package: pkg, price, active,
  });
  res.status(201).json({ success: true, pricing: entry });
});

const updatePricing = asyncHandler(async (req, res) => {
  const { country, countryCode, currency, service, package: pkg, price, active } = req.body;
  const entry = await CountryPricing.update(req.params.id, {
    country, countryCode, currency, service, package: pkg, price, active,
  });
  if (!entry) throw new ApiError(404, 'Pricing entry not found');
  res.json({ success: true, pricing: entry });
});

const deletePricing = asyncHandler(async (req, res) => {
  const entry = await CountryPricing.remove(req.params.id);
  if (!entry) throw new ApiError(404, 'Pricing entry not found');
  res.json({ success: true, message: 'Pricing entry deleted' });
});

module.exports = {
  getPricing, listCountries, listPricingAdmin, createPricing, updatePricing, deletePricing,
};
