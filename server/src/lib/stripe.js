const Stripe = require('stripe');

let _stripe = null;

// Lazily constructed so requiring this file doesn't throw when
// STRIPE_SECRET_KEY isn't set yet (tests, or before the key is
// provisioned) — same rationale as lib/supabase.js.
const getStripe = () => {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY must be set');
  }

  _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return _stripe;
};

module.exports = { getStripe };
