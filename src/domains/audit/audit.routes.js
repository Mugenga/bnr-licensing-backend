const router = require('express').Router();
const controller = require('./audit.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/applications/:id/audit-logs', requireAuth, controller.getApplicationAuditLogs);

module.exports = router;
