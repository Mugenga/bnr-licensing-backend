const { Application } = require('../../db/models');
const repository = require('./audit.repository');
const { ForbiddenError, NotFoundError } = require('../../utils/errors');
const { hasPermission } = require('../../middleware/permission.middleware');
const { PERMISSIONS } = require('../applications/applicationPermissions');

async function createAuditLog(data, transaction) {
  return repository.create(data, { transaction });
}

async function getApplicationAuditLogs(applicationId, currentUser) {
  const application = await Application.findByPk(applicationId);
  if (!application) throw new NotFoundError('Application not found');

  if (!hasPermission(currentUser, PERMISSIONS.VIEW_AUDIT_LOGS)) {
    const canViewOwn = hasPermission(currentUser, PERMISSIONS.VIEW_OWN_AUDIT_SUMMARY)
      && application.applicant_user_id === currentUser.id;
    if (!canViewOwn) throw new ForbiddenError();
  }

  const logs = await repository.findByApplication(applicationId);
  if (hasPermission(currentUser, PERMISSIONS.VIEW_AUDIT_LOGS)) return logs;

  return logs.map((log) => ({
    id: log.id,
    application_id: log.application_id,
    action: log.action,
    from_status: log.from_status,
    to_status: log.to_status,
    created_at: log.created_at || log.createdAt
  }));
}

module.exports = { createAuditLog, getApplicationAuditLogs };
