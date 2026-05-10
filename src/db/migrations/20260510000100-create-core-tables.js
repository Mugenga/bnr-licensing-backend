'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    }

    await queryInterface.createTable('roles', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: Sequelize.TEXT,
      is_system_role: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('permissions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('role_permissions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      role_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'roles', key: 'id' }, onDelete: 'CASCADE' },
      permission_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'permissions', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('role_permissions', {
      fields: ['role_id', 'permission_id'],
      type: 'unique',
      name: 'uniq_role_permissions_role_permission'
    });

    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      full_name: { type: Sequelize.STRING(150), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      password_hash: { type: Sequelize.TEXT, allowNull: false },
      role_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'roles', key: 'id' } },
      organization_name: Sequelize.STRING(200),
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('applications', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      reference_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      applicant_user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      institution_name: { type: Sequelize.STRING(200), allowNull: false },
      license_type: { type: Sequelize.STRING(100), allowNull: false },
      description: Sequelize.TEXT,
      status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'draft' },
      reviewed_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' } },
      reviewed_at: Sequelize.DATE,
      final_decision_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' } },
      final_decision_at: Sequelize.DATE,
      final_decision_note: Sequelize.TEXT,
      version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('applications', ['status'], { name: 'idx_applications_status' });
    await queryInterface.addIndex('applications', ['applicant_user_id'], { name: 'idx_applications_applicant_user_id' });
    await queryInterface.addIndex('applications', ['reviewed_by'], { name: 'idx_applications_reviewed_by' });

    await queryInterface.createTable('application_documents', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      application_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'applications', key: 'id' }, onDelete: 'CASCADE' },
      uploaded_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      stored_name: { type: Sequelize.STRING(255), allowNull: false },
      mime_type: { type: Sequelize.STRING(100), allowNull: false },
      size_bytes: { type: Sequelize.INTEGER, allowNull: false },
      version: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('application_documents', ['application_id'], { name: 'idx_application_documents_application_id' });
    await queryInterface.addIndex('application_documents', ['uploaded_by'], { name: 'idx_application_documents_uploaded_by' });

    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      application_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'applications', key: 'id' } },
      actor_user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      action: { type: Sequelize.STRING(100), allowNull: false },
      from_status: Sequelize.STRING(50),
      to_status: Sequelize.STRING(50),
      metadata: Sequelize.JSONB,
      created_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('audit_logs', ['application_id'], { name: 'idx_audit_logs_application_id' });
    await queryInterface.addIndex('audit_logs', ['actor_user_id'], { name: 'idx_audit_logs_actor_user_id' });
    await queryInterface.addIndex('audit_logs', ['created_at'], { name: 'idx_audit_logs_created_at' });

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION prevent_audit_log_changes()
        RETURNS trigger AS $$
        BEGIN
          RAISE EXCEPTION 'audit_logs are append-only and cannot be modified or deleted';
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER audit_logs_no_update
        BEFORE UPDATE ON audit_logs
        FOR EACH ROW
        EXECUTE FUNCTION prevent_audit_log_changes();

        CREATE TRIGGER audit_logs_no_delete
        BEFORE DELETE ON audit_logs
        FOR EACH ROW
        EXECUTE FUNCTION prevent_audit_log_changes();
      `);
    }
  },

  async down(queryInterface) {
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;');
      await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit_logs;');
      await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS prevent_audit_log_changes();');
    }
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('application_documents');
    await queryInterface.dropTable('applications');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
  }
};
