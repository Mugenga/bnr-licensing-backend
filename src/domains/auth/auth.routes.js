const router = require('express').Router();
const controller = require('./auth.controller');
const validate = require('../../middleware/validate.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { loginSchema, registerSchema } = require('./auth.schemas');

router.post('/login', validate(loginSchema), controller.login);
router.post('/register', validate(registerSchema), controller.register);
router.get('/me', requireAuth, controller.me);

module.exports = router;
