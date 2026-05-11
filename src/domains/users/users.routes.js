const router = require('express').Router();
const controller = require('./users.controller');
const validate = require('../../middleware/validate.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { PERMISSIONS } = require('../applications/applicationPermissions');
const { createUserSchema, updateUserSchema, statusSchema } = require('./users.schemas');

// All user management routes require authentication and manage users permission
router.use(requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS));

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', validate(createUserSchema), controller.create);
router.patch('/:id', validate(updateUserSchema), controller.update);
router.patch('/:id/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
