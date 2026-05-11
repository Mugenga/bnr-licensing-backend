const router = require('express').Router();
const controller = require('./auth.controller');
const validate = require('../../middleware/validate.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { loginSchema, registerSchema } = require('./auth.schemas');

router.post('/login', validate(loginSchema), controller.login); // Endpoint for user login
router.post('/register', validate(registerSchema), controller.register); // Endpoint for user registration (applicants)
router.get('/me', requireAuth, controller.me); // Get current user info, requires authentication

module.exports = router;
