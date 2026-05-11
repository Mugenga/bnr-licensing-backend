const router = require('express').Router();
const controller = require('./documents.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { uploadDocuments } = require('../../middleware/upload.middleware');

router.use(requireAuth);
router.post('/applications/:id/documents', uploadDocuments, controller.upload);
router.get('/applications/:id/documents', controller.list);
router.get('/documents/:id/download', controller.download);

module.exports = router;
