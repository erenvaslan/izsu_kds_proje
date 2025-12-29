const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const healthRoutes = require('./healthRoutes');
const datasetRoutes = require('./datasetRoutes');
const metricsRoutes = require('./metricsRoutes');
const predictionsRoutes = require('./predictionsRoutes');

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/datasets', datasetRoutes);
router.use('/metrics', metricsRoutes);
router.use('/predictions', predictionsRoutes);

module.exports = router;

