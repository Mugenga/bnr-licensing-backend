const { AuditLog } = require('../../db/models');

async function create(data, options = {}) {
  return AuditLog.create(data, options);
}

async function findByApplication(applicationId) {
  return AuditLog.findAll({
    where: { application_id: applicationId },
    order: [['created_at', 'ASC']]
  });
}

module.exports = { create, findByApplication };
