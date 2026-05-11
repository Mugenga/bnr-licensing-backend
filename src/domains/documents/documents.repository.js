const { ApplicationDocument } = require('../../db/models');

async function findByApplication(applicationId) {
  return ApplicationDocument.findAll({
    where: { application_id: applicationId },
    order: [['version', 'ASC'], ['created_at', 'ASC']]
  });
}

async function findById(id) {
  return ApplicationDocument.findByPk(id);
}

async function maxVersion(applicationId, transaction) {
  const max = await ApplicationDocument.max('version', { where: { application_id: applicationId }, transaction });
  return max || 0;
}

async function bulkCreate(documents, transaction) {
  return ApplicationDocument.bulkCreate(documents, { transaction });
}

module.exports = { findByApplication, findById, maxVersion, bulkCreate };
