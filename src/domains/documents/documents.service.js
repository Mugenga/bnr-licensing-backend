const path = require('path');
const { sequelize } = require('../../db/models');
const applicationsRepository = require('../applications/applications.repository');
const repository = require('./documents.repository');
const auditService = require('../audit/audit.service');
const { APPLICATION_STATUS } = require('../applications/applicationStates');
const { PERMISSIONS } = require('../applications/applicationPermissions');
const { hasPermission } = require('../../middleware/permission.middleware');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../../utils/errors');

const UPLOAD_STATES = [APPLICATION_STATUS.DRAFT, APPLICATION_STATUS.ADDITIONAL_DOCUMENTS_REQUESTED];

function canViewDocuments(application, user) {
  return hasPermission(user, PERMISSIONS.VIEW_DOCUMENTS)
    || (hasPermission(user, PERMISSIONS.VIEW_OWN_DOCUMENTS) && application.applicant_user_id === user.id);
}

async function uploadDocuments(applicationId, files, user, documentTypes = []) {
  if (!hasPermission(user, PERMISSIONS.UPLOAD_DOCUMENTS)) throw new ForbiddenError();
  if (!files?.length) throw new BadRequestError('At least one document is required.');

  return sequelize.transaction(async (transaction) => {
    const application = await applicationsRepository.findLocked(applicationId, transaction);
    if (!application) throw new NotFoundError('Application not found');
    if (application.applicant_user_id !== user.id) throw new ForbiddenError();
    if (!UPLOAD_STATES.includes(application.status)) {
      throw new BadRequestError('Documents can only be uploaded in draft or additional documents requested states.');
    }

    const version = (await repository.maxVersion(applicationId, transaction)) + 1;
    const documents = await repository.bulkCreate(files.map((file, index) => ({
      application_id: applicationId,
      uploaded_by: user.id,
      original_name: file.originalname,
      stored_name: file.filename,
      document_type: documentTypes[index] || null,
      mime_type: file.mimetype,
      size_bytes: file.size,
      version
    })), transaction);

    await auditService.createAuditLog({
      application_id: application.id,
      actor_user_id: user.id,
      action: 'documents_uploaded',
      from_status: application.status,
      to_status: application.status,
      metadata: { count: documents.length, version }
    }, transaction);

    return documents;
  });
}

async function getApplicationDocuments(applicationId, user) {
  const application = await applicationsRepository.findById(applicationId);
  if (!application) throw new NotFoundError('Application not found');
  if (!canViewDocuments(application, user)) throw new ForbiddenError();
  return repository.findByApplication(applicationId);
}

async function getDownload(documentId, user) {
  const document = await repository.findById(documentId);
  if (!document) throw new NotFoundError('Document not found');
  const application = await applicationsRepository.findById(document.application_id);
  if (!canViewDocuments(application, user)) throw new ForbiddenError();
  return {
    document,
    path: path.resolve(process.cwd(), 'storage', 'documents', document.stored_name)
  };
}

module.exports = { uploadDocuments, getApplicationDocuments, getDownload };
