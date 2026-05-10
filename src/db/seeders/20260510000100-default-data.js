'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { DEFAULT_PERMISSIONS, ROLE_PERMISSION_MAP } = require('../../domains/applications/applicationPermissions');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const permissionRows = DEFAULT_PERMISSIONS.map((name) => ({
      id: uuid(),
      name,
      description: name.replace(/_/g, ' '),
      created_at: now,
      updated_at: now
    }));
    await queryInterface.bulkInsert('permissions', permissionRows);

    const roles = ['superadmin', 'applicant', 'officer', 'approver'].map((name) => ({
      id: uuid(),
      name,
      description: `${name} role`,
      is_system_role: true,
      created_at: now,
      updated_at: now
    }));
    await queryInterface.bulkInsert('roles', roles);

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
    await queryInterface.bulkInsert('role_permissions', rolePermissions);

    const passwordHash = await bcrypt.hash('Password123!', 12);
    const users = [
      ['Super Admin', 'superadmin@nrb.test', 'superadmin', null],
      ['Applicant User', 'applicant@nrb.test', 'applicant', 'Rwanda Community Bank'],
      ['Licensing Officer', 'officer@nrb.test', 'officer', 'National Regulator'],
      ['Senior Approver', 'approver@nrb.test', 'approver', 'National Regulator']
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
    await queryInterface.bulkInsert('users', users);

    const userByEmail = Object.fromEntries(users.map((user) => [user.email, user]));
    const applications = [
      {
        id: uuid(),
        reference_number: 'APP-2026-0001',
        applicant_user_id: userByEmail['applicant@nrb.test'].id,
        institution_name: 'Rwanda Community Bank',
        license_type: 'Commercial Bank License',
        description: 'Seed submitted application.',
        status: 'submitted',
        version: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: uuid(),
        reference_number: 'APP-2026-0002',
        applicant_user_id: userByEmail['applicant@nrb.test'].id,
        institution_name: 'Kigali Finance Trust',
        license_type: 'Commercial Bank License',
        description: 'Seed pending approval application.',
        status: 'pending_approval',
        reviewed_by: userByEmail['officer@nrb.test'].id,
        reviewed_at: now,
        version: 2,
        created_at: now,
        updated_at: now
      }
    ];
    await queryInterface.bulkInsert('applications', applications);

    await queryInterface.bulkInsert('audit_logs', [
      {
        id: uuid(),
        application_id: applications[0].id,
        actor_user_id: userByEmail['applicant@nrb.test'].id,
        action: 'application_submitted',
        from_status: 'draft',
        to_status: 'submitted',
        metadata: {},
        created_at: now
      },
      {
        id: uuid(),
        application_id: applications[1].id,
        actor_user_id: userByEmail['officer@nrb.test'].id,
        action: 'marked_pending_approval',
        from_status: 'under_review',
        to_status: 'pending_approval',
        metadata: {},
        created_at: now
      }
    ]);
  },

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
