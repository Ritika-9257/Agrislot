const express = require('express');
const AuthController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validateRequest');
const { loginSchema } = require('../validators/admin.validator');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.post('/login', authLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post('/setup-password', authLimiter, AuthController.setupPassword);
router.post('/google', AuthController.googleLogin);
router.post('/register', validateRequest({ body: loginSchema }), AuthController.register);
router.get('/me', authenticate, AuthController.getMe);

module.exports = router;
