const express = require('express');
const router = express.Router();
const MetricsController = require('../controllers/MetricsController');

// Overview
router.get('/overview', MetricsController.overview);

// Reservoirs
router.get('/reservoirs', MetricsController.reservoirs);
router.get('/reservoirs-latest', MetricsController.reservoirsLatest);
router.get('/reservoirs-days-to-threshold', MetricsController.reservoirsDaysToThreshold);

// Production
router.get('/production-monthly', MetricsController.productionMonthly);
router.get('/production-annual', MetricsController.productionAnnual);

// Consumption
router.get('/consumption-top', MetricsController.consumptionTop);

// Losses
router.get('/losses-trend', MetricsController.lossesTrend);
router.get('/losses-monthly', MetricsController.lossesMonthly);
router.get('/losses-by-district', MetricsController.lossesByDistrict);
router.get('/losses-breakdown', MetricsController.lossesBreakdown);
router.get('/losses-breakdown-all', MetricsController.lossesBreakdownAll);

// Districts & Neighborhoods
router.get('/districts', MetricsController.districts);
router.get('/districts/availability', MetricsController.districtAvailability);
router.get('/neighborhoods', MetricsController.neighborhoods);

module.exports = router;

