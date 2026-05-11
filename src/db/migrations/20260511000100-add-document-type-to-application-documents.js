'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('application_documents', 'document_type', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addIndex('application_documents', ['application_id', 'document_type'], {
      name: 'idx_application_documents_application_document_type'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('application_documents', 'idx_application_documents_application_document_type');
    await queryInterface.removeColumn('application_documents', 'document_type');
  }
};
