'use strict';

const { v4: uuid } = require('uuid');
const { REQUIRED_DOCUMENTS } = require('../../domains/applications/requiredDocuments');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('required_documents', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      license_type: { type: Sequelize.STRING(100), allowNull: false },
      document_key: { type: Sequelize.STRING(100), allowNull: false },
      label: { type: Sequelize.STRING(150), allowNull: false },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('required_documents', {
      fields: ['license_type', 'document_key'],
      type: 'unique',
      name: 'uniq_required_documents_license_key'
    });
    await queryInterface.addIndex('required_documents', ['license_type'], { name: 'idx_required_documents_license_type' });

    const now = new Date();
    const rows = Object.entries(REQUIRED_DOCUMENTS).flatMap(([licenseType, documents]) =>
      documents.map((document, index) => ({
        id: uuid(),
        license_type: licenseType,
        document_key: document.key,
        label: document.label,
        sort_order: index,
        created_at: now,
        updated_at: now
      }))
    );
    await queryInterface.bulkInsert('required_documents', rows);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('required_documents');
  }
};
