'use strict';

const bcrypt = require('bcryptjs');
const { Op, QueryTypes } = require('sequelize');
const { v4: uuid } = require('uuid');
const { DEFAULT_PERMISSIONS, ROLE_PERMISSION_MAP } = require('../../domains/applications/applicationPermissions');
const { REQUIRED_DOCUMENTS } = require('../../domains/applications/requiredDocuments');

const SEED_ROLE_NAMES = ['superadmin', 'applicant', 'officer', 'approver'];
const SEED_USER_EMAILS = [
  'superadmin@bnr.rw',
  'applicant@bnr.rw',
  'applicant2@bnr.rw',
  'cnythia@bnr.rw',
  'cynthia@bnr.rw',
  'officer@bnr.rw',
  'approver@bnr.rw'
];
const SEED_APPLICATION_REFS = Array.from({ length: 16 }, (_, index) => `APP-2026-${String(index + 1).padStart(4, '0')}`);
const SEED_LICENSE_TYPES = Object.keys(REQUIRED_DOCUMENTS);

async function cleanupSeedData(queryInterface, transaction) {
  const options = { transaction };

  // Audit logs are append-only, so seed cleanup must disable the trigger shortly.
  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query('ALTER TABLE audit_logs DISABLE TRIGGER USER;', options);
  }

  // Remove only the records owned by this seeder so local test data is not touched.
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
  await queryInterface.bulkDelete('required_documents', { license_type: { [Op.in]: SEED_LICENSE_TYPES } }, options);
  // Role permissions are regenerated below, so delete just the seeded role-permission pairs.
  await queryInterface.sequelize.query(
    `DELETE FROM role_permissions
     WHERE role_id IN (SELECT id FROM roles WHERE name IN (:roles))
        AND permission_id IN (SELECT id FROM permissions WHERE name IN (:permissions));`,
    { ...options, replacements: { roles: SEED_ROLE_NAMES, permissions: DEFAULT_PERMISSIONS } }
  );
}

async function findByName(queryInterface, table, names, transaction) {
  // This helps later seed rows refer to stable database ids instead of guessing them.
  const rows = await queryInterface.sequelize.query(
    `SELECT id, name FROM ${table} WHERE name IN (:names);`,
    { transaction, replacements: { names }, type: QueryTypes.SELECT }
  );
  return Object.fromEntries(rows.map((row) => [row.name, row]));
}

async function findUsersByEmail(queryInterface, emails, transaction) {
  // Users may already exist because seed uses ignoreDuplicates.
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
      // Make this seeder safe to run again during demos.
      await cleanupSeedData(queryInterface, transaction);

      // Seed the complete permission catalog first because roles depend on it.
      const permissionRows = DEFAULT_PERMISSIONS.map((name) => ({
        id: uuid(),
        name,
        description: name.replace(/_/g, ' '),
        created_at: now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('permissions', permissionRows, { transaction, ignoreDuplicates: true });

      // System roles are defaults, but the app can still create custom roles later.
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
      // Connect each default role to the permissions from applicationPermissions.js.
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

      // Same password for seeded users keeps manual testing easy.
      const passwordHash = await bcrypt.hash('Password123!', 12);
      const users = [
        ['Super Admin', 'superadmin@bnr.rw', 'superadmin', null],
        ['Hoza Cynthia', 'applicant@bnr.rw', 'applicant', 'I&M Bank Rwanda Limited'],
        ['Yves Applicant', 'applicant2@bnr.rw', 'applicant', 'Kigali Finance Trust'],
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
      // Required documents start with one per license type. Admin can update later.
      const requiredDocumentRows = Object.entries(REQUIRED_DOCUMENTS).flatMap(([licenseType, documents]) =>
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
      await queryInterface.bulkInsert('required_documents', requiredDocumentRows, { transaction });

      // Two records for each status, so every dashboard filter has something to show.
      const seedStatuses = [
        'draft',
        'submitted',
        'under_review',
        'additional_documents_requested',
        'resubmitted',
        'pending_approval',
        'approved',
        'rejected'
      ];
      const institutionNames = [
        'I&M Bank Rwanda Limited',
        'Bank of Kigali',
        'Equity Bank',
        'Umwalimu Saccoo',
        'Virunga Forex Bureau',
        'MTN Mobile Money Limited',
        'Sanlam Insurance',
        'Muhazi Cooperative Finance',
        'Banque Populaire du Rwanda',
        'Imboni Microfinance',
        'Huye Forex Services',
        'Airtel Mobile Money Rwanda',
        'Ishema Insurance',
        'Gasabo Trust Bank',
        'Rubavu Finance House',
        'Bank of Africa Rwanda Limited'
      ];
      const licenseTypes = [
        'Commercial Bank License',
        'Commercial Bank License',
        'Commercial Bank License',
        'Microfinance License',
        'Forex Bureau License',
        'Mobile Money License',
        'Insurance License',
        'Microfinance License',
        'Commercial Bank License',
        'Microfinance License',
        'Forex Bureau License',
        'Mobile Money License',
        'Insurance License',
        'Commercial Bank License',
        'Microfinance License',
        'Commercial Bank License'
      ];

      // Applications are generated from status list above instead of writing 16 objects by hand.
      const applications = seedStatuses.flatMap((status, statusIndex) =>
        [0, 1].map((copyIndex) => {
          const index = (statusIndex * 2) + copyIndex;
          const isApplicantOne = copyIndex === 0;
          const application = {
            id: uuid(),
            reference_number: SEED_APPLICATION_REFS[index],
            applicant_user_id: userByEmail[isApplicantOne ? 'applicant@bnr.rw' : 'applicant2@bnr.rw'].id,
            institution_name: institutionNames[index],
            license_type: licenseTypes[index],
            description: `Seed ${status.replace(/_/g, ' ')} application.`,
            status,
            version: status === 'draft' ? 0 : 1,
            created_at: now,
            updated_at: now
          };

          // These statuses imply an officer has already touched the application.
          if (['under_review', 'additional_documents_requested', 'resubmitted', 'pending_approval', 'approved', 'rejected'].includes(status)) {
            application.reviewed_by = userByEmail['officer@bnr.rw'].id;
            application.reviewed_at = now;
          }

          // Final states also need approver and decision notes for the UI.
          if (['approved', 'rejected'].includes(status)) {
            application.final_decision_by = userByEmail['approver@bnr.rw'].id;
            application.final_decision_at = now;
            application.final_decision_note = status === 'approved' ? 'Application meets requirements.' : 'Application needs material correction.';
          }

          return application;
        })
      );
      await queryInterface.bulkInsert('applications', applications, { transaction });

      // Build matching audit history so timeline pages do not look empty or fake.
      const auditRows = applications.flatMap((application) => {
        const applicantId = application.applicant_user_id;
        const rows = [{
          id: uuid(),
          application_id: application.id,
          actor_user_id: applicantId,
          action: 'application_created',
          from_status: null,
          to_status: 'draft',
          metadata: JSON.stringify({}),
          created_at: now
        }];

        // Anything past draft must include the original submit action.
        if (application.status !== 'draft') {
          rows.push({
            id: uuid(),
            application_id: application.id,
            actor_user_id: applicantId,
            action: 'application_submitted',
            from_status: 'draft',
            to_status: 'submitted',
            metadata: JSON.stringify({}),
            created_at: now
          });
        }

        // These statuses mean review was started before the current state.
        if (['under_review', 'additional_documents_requested', 'resubmitted', 'pending_approval', 'approved', 'rejected'].includes(application.status)) {
          rows.push({
            id: uuid(),
            application_id: application.id,
            actor_user_id: userByEmail['officer@bnr.rw'].id,
            action: 'review_started',
            from_status: 'submitted',
            to_status: 'under_review',
            metadata: JSON.stringify({}),
            created_at: now
          });
        }

        // Resubmitted applications still need the earlier request message in timeline.
        if (application.status === 'additional_documents_requested' || application.status === 'resubmitted') {
          rows.push({
            id: uuid(),
            application_id: application.id,
            actor_user_id: userByEmail['officer@bnr.rw'].id,
            action: 'additional_documents_requested',
            from_status: 'under_review',
            to_status: 'additional_documents_requested',
            metadata: JSON.stringify({ message: 'Please upload the requested supporting document.' }),
            created_at: now
          });
        }

        // Only resubmitted status gets the applicant resubmit event.
        if (application.status === 'resubmitted') {
          rows.push({
            id: uuid(),
            application_id: application.id,
            actor_user_id: applicantId,
            action: 'application_resubmitted',
            from_status: 'additional_documents_requested',
            to_status: 'resubmitted',
            metadata: JSON.stringify({}),
            created_at: now
          });
        }

        // Pending approval and final decisions must show officer handoff.
        if (['pending_approval', 'approved', 'rejected'].includes(application.status)) {
          rows.push({
            id: uuid(),
            application_id: application.id,
            actor_user_id: userByEmail['officer@bnr.rw'].id,
            action: 'marked_pending_approval',
            from_status: 'under_review',
            to_status: 'pending_approval',
            metadata: JSON.stringify({}),
            created_at: now
          });
        }

        // Final states should carry the actual final decision audit record.
        if (application.status === 'approved' || application.status === 'rejected') {
          rows.push({
            id: uuid(),
            application_id: application.id,
            actor_user_id: userByEmail['approver@bnr.rw'].id,
            action: application.status === 'approved' ? 'application_approved' : 'application_rejected',
            from_status: 'pending_approval',
            to_status: application.status,
            metadata: JSON.stringify({ note: application.final_decision_note }),
            created_at: now
          });
        }

        return rows;
      });
      await queryInterface.bulkInsert('audit_logs', auditRows, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Down uses same cleanup so undo stays focused on seeded data only.
      await cleanupSeedData(queryInterface, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
