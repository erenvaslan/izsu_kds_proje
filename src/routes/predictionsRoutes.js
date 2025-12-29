const express = require('express');
const router = express.Router();
const PredictionsController = require('../controllers/PredictionsController');

router.get('/demand', PredictionsController.demand);

module.exports = router;

