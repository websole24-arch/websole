const express = require('express');
const authRoutes = require('./authRoutes');
const serviceRoutes = require('./serviceRoutes');
const packageRoutes = require('./packageRoutes');
const pricingRoutes = require('./pricingRoutes');
const inquiryRoutes = require('./inquiryRoutes');
const projectRoutes = require('./projectRoutes');
const paymentRoutes = require('./paymentRoutes');
const fileRoutes = require('./fileRoutes');
const userRoutes = require('./userRoutes');
const reviewRoutes = require('./reviewRoutes');
const portfolioRoutes = require('./portfolioRoutes');
const freeToolRoutes = require('./freeToolRoutes');
const settingsRoutes = require('./settingsRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/packages', packageRoutes);
router.use('/pricing', pricingRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/projects', projectRoutes);
router.use('/payments', paymentRoutes);
router.use('/projects', fileRoutes); // mounts /:id/files under the same prefix
router.use('/users', userRoutes);
router.use('/reviews', reviewRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/free-tools', freeToolRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
