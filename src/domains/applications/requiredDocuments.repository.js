const { RequiredDocument } = require('../../db/models');

async function findAll() {
  return RequiredDocument.findAll({ order: [['license_type', 'ASC'], ['sort_order', 'ASC']] });
}

async function findByLicenseType(licenseType, transaction) {
  return RequiredDocument.findAll({
    where: { license_type: licenseType },
    order: [['sort_order', 'ASC']],
    transaction
  });
}

async function replaceForLicenseType(licenseType, documents, transaction) {
  await RequiredDocument.destroy({ where: { license_type: licenseType }, transaction });
  return RequiredDocument.bulkCreate(documents.map((document, index) => ({
    license_type: licenseType,
    document_key: document.key,
    label: document.label,
    sort_order: index
  })), { transaction });
}

module.exports = { findAll, findByLicenseType, replaceForLicenseType };
