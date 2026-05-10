const router = require('express').Router();
const controller = require('./roles.controller');
const validate = require('../../middleware/validate.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { PERMISSIONS } = require('../applications/applicationPermissions');
const { createRoleSchema, updateRoleSchema, rolePermissionsSchema } = require('./roles.schemas');

router.use(requireAuth);
router.get('/permissions', requirePermission(PERMISSIONS.MANAGE_ROLES), controller.permissions);
router.get('/roles', requirePermission(PERMISSIONS.MANAGE_ROLES), controller.list);
router.get('/roles/:id', requirePermission(PERMISSIONS.MANAGE_ROLES), controller.get);
router.post('/roles', requirePermission(PERMISSIONS.MANAGE_ROLES), validate(createRoleSchema), controller.create);
router.patch('/roles/:id', requirePermission(PERMISSIONS.MANAGE_ROLES), validate(updateRoleSchema), controller.update);
router.delete('/roles/:id', requirePermission(PERMISSIONS.MANAGE_ROLES), controller.remove);
router.put('/roles/:id/permissions', requirePermission(PERMISSIONS.MANAGE_ROLES), validate(rolePermissionsSchema), controller.setPermissions);

module.exports = router;
