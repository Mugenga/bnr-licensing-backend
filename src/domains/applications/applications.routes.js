const router = require('express').Router();
const controller = require('./applications.controller');
const validate = require('../../middleware/validate.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { PERMISSIONS } = require('./applicationPermissions');
const { createApplicationSchema, requestDocumentsSchema, decisionSchema, requiredDocumentsSchema } = require('./applications.schemas');

router.use(requireAuth);
router.get('/required-documents', controller.requiredDocuments);
router.put('/required-documents', requirePermission(PERMISSIONS.MANAGE_ROLES), validate(requiredDocumentsSchema), controller.setRequiredDocuments);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', requirePermission(PERMISSIONS.CREATE_APPLICATION), validate(createApplicationSchema), controller.create);
router.patch('/:id/submit', requirePermission(PERMISSIONS.CREATE_APPLICATION), controller.submit);
router.patch('/:id/review', requirePermission(PERMISSIONS.REVIEW_APPLICATION), controller.review);
router.patch('/:id/request-documents', requirePermission(PERMISSIONS.REQUEST_ADDITIONAL_DOCUMENTS), validate(requestDocumentsSchema), controller.requestDocuments);
router.patch('/:id/resubmit', requirePermission(PERMISSIONS.RESUBMIT_APPLICATION), controller.resubmit);
router.patch('/:id/pending-approval', requirePermission(PERMISSIONS.MARK_PENDING_APPROVAL), controller.pendingApproval);
router.patch('/:id/approve', requirePermission(PERMISSIONS.APPROVE_APPLICATION), validate(decisionSchema), controller.approve);
router.patch('/:id/reject', requirePermission(PERMISSIONS.REJECT_APPLICATION), validate(decisionSchema), controller.reject);

module.exports = router;
