const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { requireAuth } = require('../middlewares/auth');

router.post('/login', AuthController.login);
router.get('/me', requireAuth, AuthController.me);

module.exports = router;

