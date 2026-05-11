const { sequelize } = require('../../db/models');
const repository = require('./applications.repository');
const documentsRepository = require('../documents/documents.repository');
const requiredDocumentsRepository = require('./requiredDocuments.repository');
const auditService = require('../audit/audit.service');
const notifications = require('../notifications/notifications.service');
const { APPLICATION_STATUS, canTransition } = require('./applicationStates');
const { PERMISSIONS } = require('./applicationPermissions');
const { REQUIRED_DOCUMENTS, getRequiredDocuments } = require('./requiredDocuments');
const { hasPermission } = require('../../middleware/permission.middleware');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../../utils/errors');
const { Op } = require('sequelize');

function assertPermission(user, permissionName) {
  if (!hasPermission(user, permissionName)) throw new ForbiddenError();
}

function assertOwner(application, user) {
  if (application.applicant_user_id !== user.id) throw new ForbiddenError();
}

function assertTransition(application, toStatus) {
  if (!canTransition(application.status, toStatus)) {
    throw new BadRequestError(`Invalid application status transition from ${application.status} to ${toStatus}.`);
  }
}

async function nextReferenceNumber(transaction) {
  const year = new Date().getFullYear();
  const count = await repository.countByYear(year, transaction);
  return `APP-${year}-${String(count + 1).padStart(4, '0')}`;
}

async function log(application, user, action, fromStatus, toStatus, metadata, transaction) {
  await auditService.createAuditLog({
    application_id: application.id,
    actor_user_id: user.id,
    action,
    from_status: fromStatus,
    to_status: toStatus,
    metadata
  }, transaction);
}

async function assertRequiredDocuments(application, transaction) {
  const requiredDocuments = await getRequiredDocumentsForLicense(application.license_type, transaction);
  if (!requiredDocuments.length) return;

  const uploadedTypes = new Set(await documentsRepository.findDocumentTypesByApplication(application.id, transaction));
  const missing = requiredDocuments.filter((document) => !uploadedTypes.has(document.key));
  if (missing.length) {
    throw new BadRequestError(`Missing required documents: ${missing.map((document) => document.label).join(', ')}.`);
  }
}

async function withWorkflowLock(id, user, permissionName, toStatus, action, updater) {
  assertPermission(user, permissionName);
  return sequelize.transaction(async (transaction) => {
    const application = await repository.findLocked(id, transaction);
    if (!application) throw new NotFoundError('Application not found');
    assertTransition(application, toStatus);
    const fromStatus = application.status;
    await updater(application, transaction);
    application.status = toStatus;
    application.version += 1;
    await application.save({ transaction });
    await log(application, user, action, fromStatus, toStatus, application._auditMetadata || {}, transaction);
    return application;
  });
}

async function createApplication(data, user) {
  assertPermission(user, PERMISSIONS.CREATE_APPLICATION);
  return sequelize.transaction(async (transaction) => {
    const application = await repository.create({
      reference_number: await nextReferenceNumber(transaction),
      applicant_user_id: user.id,
      institution_name: data.institutionName,
      license_type: data.licenseType,
      description: data.description,
      status: APPLICATION_STATUS.DRAFT
    }, { transaction });
    await log(application, user, 'application_created', null, APPLICATION_STATUS.DRAFT, {}, transaction);
    return application;
  });
}

async function submitApplication(id, user) {
  const application = await withWorkflowLock(id, user, PERMISSIONS.CREATE_APPLICATION, APPLICATION_STATUS.SUBMITTED, 'application_submitted', async (app, transaction) => {
    assertOwner(app, user);
    await assertRequiredDocuments(app, transaction);
  });
  await notifications.notifyApplicationSubmitted(application);
  return application;
}

async function startReview(id, user) {
  return withWorkflowLock(id, user, PERMISSIONS.REVIEW_APPLICATION, APPLICATION_STATUS.UNDER_REVIEW, 'review_started', async (app) => {
    app.reviewed_by = user.id;
    app.reviewed_at = new Date();
  });
}

async function requestDocuments(id, user, message) {
  const application = await withWorkflowLock(id, user, PERMISSIONS.REQUEST_ADDITIONAL_DOCUMENTS, APPLICATION_STATUS.ADDITIONAL_DOCUMENTS_REQUESTED, 'additional_documents_requested', async (app) => {
    app._auditMetadata = { message };
  });
  await notifications.notifyAdditionalDocumentsRequested(application, message);
  return application;
}

async function resubmitApplication(id, user) {
  const application = await withWorkflowLock(id, user, PERMISSIONS.RESUBMIT_APPLICATION, APPLICATION_STATUS.RESUBMITTED, 'application_resubmitted', async (app) => {
    assertOwner(app, user);
  });
  await notifications.notifyApplicationResubmitted(application);
  return application;
}

async function markPendingApproval(id, user) {
  return withWorkflowLock(id, user, PERMISSIONS.MARK_PENDING_APPROVAL, APPLICATION_STATUS.PENDING_APPROVAL, 'marked_pending_approval', async () => {});
}

async function finalDecision(id, user, permissionName, toStatus, action, note, notifier) {
  const application = await withWorkflowLock(id, user, permissionName, toStatus, action, async (app) => {
    if (app.reviewed_by === user.id) {
      throw new ForbiddenError('The reviewer cannot make the final decision on the same application.');
    }
    app.final_decision_by = user.id;
    app.final_decision_at = new Date();
    app.final_decision_note = note;
    app._auditMetadata = { note };
  });
  await notifier(application, note);
  return application;
}

async function approveApplication(id, user, note) {
  return finalDecision(id, user, PERMISSIONS.APPROVE_APPLICATION, APPLICATION_STATUS.APPROVED, 'application_approved', note, notifications.notifyApplicationApproved);
}

async function rejectApplication(id, user, note) {
  return finalDecision(id, user, PERMISSIONS.REJECT_APPLICATION, APPLICATION_STATUS.REJECTED, 'application_rejected', note, notifications.notifyApplicationRejected);
}

async function getApplications(query, user) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const where = {};
  if (query.status) where.status = query.status;

  if (hasPermission(user, PERMISSIONS.VIEW_ALL_APPLICATIONS)) {
    if (query.applicantUserId) where.applicant_user_id = query.applicantUserId;
    where[Op.or] = [
      { status: { [Op.ne]: APPLICATION_STATUS.DRAFT } },
      { applicant_user_id: user.id }
    ];
  } else if (hasPermission(user, PERMISSIONS.VIEW_OWN_APPLICATIONS)) {
    where.applicant_user_id = user.id;
  } else {
    throw new ForbiddenError();
  }

  const result = await repository.findAndCount({ where, limit, offset: (page - 1) * limit });
  return { ...result, page, limit };
}

async function getApplicationById(id, user) {
  const application = await repository.findById(id);
  if (!application) throw new NotFoundError('Application not found');
  if (application.status === APPLICATION_STATUS.DRAFT && application.applicant_user_id !== user.id) throw new ForbiddenError();
  if (hasPermission(user, PERMISSIONS.VIEW_ALL_APPLICATIONS)) return application;
  if (hasPermission(user, PERMISSIONS.VIEW_OWN_APPLICATIONS) && application.applicant_user_id === user.id) return application;
  throw new ForbiddenError();
}

function requiredDocumentDto(document) {
  return {
    key: document.document_key,
    label: document.label
  };
}

async function getRequiredDocumentsForLicense(licenseType, transaction) {
  const rows = await requiredDocumentsRepository.findByLicenseType(licenseType, transaction);
  if (rows.length) return rows.map(requiredDocumentDto);
  return getRequiredDocuments(licenseType);
}

async function getAllRequiredDocuments() {
  const rows = await requiredDocumentsRepository.findAll();
  if (!rows.length) return REQUIRED_DOCUMENTS;
  return rows.reduce((groups, row) => {
    groups[row.license_type] = groups[row.license_type] || [];
    groups[row.license_type].push(requiredDocumentDto(row));
    return groups;
  }, {});
}

async function setRequiredDocumentsForLicense(licenseType, documents) {
  return sequelize.transaction(async (transaction) => {
    const rows = await requiredDocumentsRepository.replaceForLicenseType(licenseType, documents, transaction);
    return rows.map(requiredDocumentDto);
  });
}

module.exports = {
  createApplication,
  submitApplication,
  startReview,
  requestDocuments,
  resubmitApplication,
  markPendingApproval,
  approveApplication,
  rejectApplication,
  getApplications,
  getApplicationById,
  getRequiredDocumentsForLicense,
  getAllRequiredDocuments,
  setRequiredDocumentsForLicense
};
