const { body } = require('express-validator');

const updateSettingsValidator = [
  body('stripePaymentsEnabled').optional().isBoolean(),
  body('whatsappPaymentsEnabled').optional().isBoolean(),
];

module.exports = { updateSettingsValidator };
