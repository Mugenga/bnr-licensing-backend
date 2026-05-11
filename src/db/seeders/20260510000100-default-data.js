'use strict';

const bcrypt = require('bcryptjs');
const { Op, QueryTypes } = require('sequelize');
const { v4: uuid } = require('uuid');
const { DEFAULT_PERMISSIONS, ROLE_PERMISSION_MAP } = require('../../domains/applications/applicationPermissions');

const SEED_ROLE_NAMES = ['superadmin', 'applicant', 'officer', 'approver'];
const SEED_USER_EMAILS = [
  'superadmin@bnr.rw',
  'applicant@bnr.rw',
  'cnythia@bnr.rw',
  'cynthia@bnr.rw',
  'officer@bnr.rw',
  'approver@bnr.rw'
];
const SEED_APPLICATION_REFS = ['APP-2026-0001', 'APP-2026-0002'];

async function cleanupSeedData(queryInterface, transaction) {
  const options = { transaction };

  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query('ALTER TABLE audit_logs DISABLE TRIGGER USER;', options);
  }

  await queryInterface.sequelize.query(
    `DELETE FROM audit_logs
     WHERE application_id IN (SELECT id FROM applications WHERE reference_number IN (:references))
        OR actor_user_id IN (SELECT id FROM users WHERE email IN (:emails));`,
    { ...options, replacements: { references: SEED_APPLICATION_REFS, emails: SEED_USER_EMAILS } }
  );

  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query('ALTER TABLE audit_logs ENABLE TRIGGER USER;', options);
  }

  await queryInterface.bulkDelete('applications', { reference_number: { [Op.in]: SEED_APPLICATION_REFS } }, options);
  await queryInterface.sequelize.query(
    `DELETE FROM role_permissions
     WHERE role_id IN (SELECT id FROM roles WHERE name IN (:roles))
        AND permission_id IN (SELECT id FROM permissions WHERE name IN (:permissions));`,
    { ...options, replacements: { roles: SEED_ROLE_NAMES, permissions: DEFAULT_PERMISSIONS } }
  );
}

async function findByName(queryInterface, table, names, transaction) {
  const rows = await queryInterface.sequelize.query(
    `SELECT id, name FROM ${table} WHERE name IN (:names);`,
    { transaction, replacements: { names }, type: QueryTypes.SELECT }
  );
  return Object.fromEntries(rows.map((row) => [row.name, row]));
}

async function findUsersByEmail(queryInterface, emails, transaction) {
  const rows = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails);',
    { transaction, replacements: { emails }, type: QueryTypes.SELECT }
  );
  return Object.fromEntries(rows.map((row) => [row.email, row]));
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();

    try {
      await cleanupSeedData(queryInterface, transaction);

      const permissionRows = DEFAULT_PERMISSIONS.map((name) => ({
        id: uuid(),
        name,
        description: name.replace(/_/g, ' '),
        created_at: now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('permissions', permissionRows, { transaction, ignoreDuplicates: true });

      const roles = SEED_ROLE_NAMES.map((name) => ({
        id: uuid(),
        name,
        description: `${name} role`,
        is_system_role: true,
        created_at: now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('roles', roles, { transaction, ignoreDuplicates: true });

      const roleByName = await findByName(queryInterface, 'roles', SEED_ROLE_NAMES, transaction);
      const permissionByName = await findByName(queryInterface, 'permissions', DEFAULT_PERMISSIONS, transaction);
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

      const passwordHash = await bcrypt.hash('Password123!', 12);
      const users = [
        ['Super Admin', 'superadmin@bnr.rw', 'superadmin', null],
        ['Hoza Cynthia', 'applicant@bnr.rw', 'applicant', 'I&M Bank Rwanda Limited'],
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
      await queryInterface.bulkInsert('users', users, { transaction, ignoreDuplicates: true });

      const userByEmail = await findUsersByEmail(queryInterface, SEED_USER_EMAILS, transaction);
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
        {
          id: uuid(),
          reference_number: 'APP-2026-0002',
          applicant_user_id: userByEmail['applicant@bnr.rw'].id,
          institution_name: 'Kigali Finance Trust',
          license_type: 'Commercial Bank License',
          description: 'Seed pending approval application.',
          status: 'pending_approval',
          reviewed_by: userByEmail['officer@bnr.rw'].id,
          reviewed_at: now,
          version: 2,
          created_at: now,
          updated_at: now
        }
      ];
      await queryInterface.bulkInsert('applications', applications, { transaction });

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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await cleanupSeedData(queryInterface, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
