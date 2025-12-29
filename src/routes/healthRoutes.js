const express = require('express');
const router = express.Router();
const HealthController = require('../controllers/HealthController');

router.get('/', HealthController.health);
router.get('/db', HealthController.healthDb);

module.exports = router;

