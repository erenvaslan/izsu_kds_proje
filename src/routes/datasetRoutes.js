const express = require('express');
const router = express.Router();
const DatasetController = require('../controllers/DatasetController');

router.get('/', DatasetController.list);
router.get('/:table', DatasetController.getTable);

module.exports = router;

