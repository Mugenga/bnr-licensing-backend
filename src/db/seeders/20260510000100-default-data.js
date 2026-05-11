'use strict';

/***
 * 
 * This seeder populates the database with default permissions, roles, a superadmin user, and a sample application.
 * It also creates audit logs for the sample application to demonstrate the logging functionality.
 */

const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { DEFAULT_PERMISSIONS, ROLE_PERMISSION_MAP } = require('../../domains/applications/applicationPermissions');

module.exports = {
  async up(queryInterface) {

    // Use a transaction to ensure all inserts succeed or fail together
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();
    try {

      // Insert default permissions
      const permissionRows = DEFAULT_PERMISSIONS.map((name) => ({
        id: uuid(),
        name,
        description: name.replace(/_/g, ' '),
        created_at: now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('permissions', permissionRows, { transaction });

      const roles = ['superadmin', 'applicant', 'officer', 'approver'].map((name) => ({
        id: uuid(),
        name,
        description: `${name} role`,
        is_system_role: true,
        created_at: now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('roles', roles, { transaction });

      const roleByName = Object.fromEntries(roles.map((role) => [role.name, role]));
      const permissionByName = Object.fromEntries(permissionRows.map((permission) => [permission.name, permission]));
      const rolePermissions = Object.entries(ROLE_PERMISSION_MAP).flatMap(([roleName, permissionNames]) =>
        permissionNames.map((permissionName) => ({
          id: uuid(),
          role_id: roleByName[roleName].id,
          permission_id: permissionByName[permissionName].id,
          created_at: now,
          updated_at: now
        }))
      );
      await queryInterface.bulkInsert('role_permissions', rolePermissions, { transaction });

      // Insert default users with hashed passwords

      const passwordHash = await bcrypt.hash('Password123!', 12);
      const users = [
        ['Super Admin', 'superadmin@bnr.rw', 'superadmin', null],
        ['Hoza Cynthia', 'cnythia@bnr.rw', 'applicant', 'I&M Bank Rwanda Limited'],
        ['Licensing Officer', 'officer@bnr.rw', 'officer', 'National Regulator'],
        ['Senior Approver', 'approver@bnr.rw', 'approver', 'National Regulator']
      ].map(([fullName, email, roleName, organizationName]) => ({
        id: uuid(),
        full_name: fullName,
        email,
        password_hash: passwordHash,
        role_id: roleByName[roleName].id,
        organization_name: organizationName,
        status: 'active',
        created_at: now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('users', users, { transaction });

      // Insert a sample application for the applicant user

      const userByEmail = Object.fromEntries(users.map((user) => [user.email, user]));
      const applications = [
        {
          id: uuid(),
          reference_number: 'APP-2026-0001',
          applicant_user_id: userByEmail['applicant@bnr.rw'].id,
          institution_name: 'I&M Bank Rwanda Limited',
          license_type: 'Commercial Bank License',
          description: 'Seed submitted application.',
          status: 'submitted',
          version: 1,
          created_at: now,
          updated_at: now
        },
      ];
      await queryInterface.bulkInsert('applications', applications, { transaction });

      // Insert audit logs for the sample application

      await queryInterface.bulkInsert('audit_logs', [
        {
          id: uuid(),
          application_id: applications[0].id,
          actor_user_id: userByEmail['applicant@bnr.rw'].id,
          action: 'application_submitted',
          from_status: 'draft',
          to_status: 'submitted',
          metadata: JSON.stringify({}),
          created_at: now
        },
        {
          id: uuid(),
          application_id: applications[1].id,
          actor_user_id: userByEmail['officer@bnr.rw'].id,
          action: 'marked_pending_approval',
          from_status: 'under_review',
          to_status: 'pending_approval',
          metadata: JSON.stringify({}),
          created_at: now
        }
      ], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  // The down function deletes all seeded data. It disables triggers on the audit_logs table to avoid issues with foreign key constraints when deleting logs
  async down(queryInterface) {
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('ALTER TABLE audit_logs DISABLE TRIGGER USER;');
    }
    await queryInterface.bulkDelete('audit_logs', null, {});
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('ALTER TABLE audit_logs ENABLE TRIGGER USER;');
    }
    await queryInterface.bulkDelete('applications', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
