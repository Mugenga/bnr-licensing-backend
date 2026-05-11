const applicationService = require('../src/domains/applications/applications.service');
const roleService = require('../src/domains/roles/roles.service');
const { APPLICATION_STATUS } = require('../src/domains/applications/applicationStates');
const { PERMISSIONS } = require('../src/domains/applications/applicationPermissions');

describe('authorization and workflow rules', () => {
  let users;

  beforeEach(async () => {
    ({ users } = await global.testDb.seedTestData());
  });

  test('applicant can create application', async () => {
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'Commercial Bank License' }, users.applicant);
    expect(app.status).toBe(APPLICATION_STATUS.DRAFT);
    expect(app.applicant_user_id).toBe(users.applicant.id);
  });

  test('applicant cannot view another applicant application', async () => {
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await expect(applicationService.getApplicationById(app.id, users.otherApplicant)).rejects.toMatchObject({ statusCode: 403 });
  });

  test('draft applications are only visible to the owner applicant', async () => {
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);

    // Draft is private work-in-progress, staff should not open it directly.
    await expect(applicationService.getApplicationById(app.id, users.officer)).rejects.toMatchObject({ statusCode: 403 });
    await expect(applicationService.getApplicationById(app.id, users.superadmin)).rejects.toMatchObject({ statusCode: 403 });

    // Draft should also not leak through list views.
    const officerList = await applicationService.getApplications({}, users.officer);
    const adminList = await applicationService.getApplications({}, users.superadmin);

    expect(officerList.rows.some((row) => row.id === app.id)).toBe(false);
    expect(adminList.rows.some((row) => row.id === app.id)).toBe(false);
  });

  test('officer can review and cannot approve', async () => {
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    const reviewed = await applicationService.startReview(app.id, users.officer);
    expect(reviewed.status).toBe(APPLICATION_STATUS.UNDER_REVIEW);
    await applicationService.markPendingApproval(app.id, users.officer);
    await expect(applicationService.approveApplication(app.id, users.officer, 'ok')).rejects.toMatchObject({ statusCode: 403 });
  });

  test('approver can approve and cannot request additional documents', async () => {
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    await applicationService.startReview(app.id, users.officer);
    await expect(applicationService.requestDocuments(app.id, users.approver, 'Need files')).rejects.toMatchObject({ statusCode: 403 });
    await applicationService.markPendingApproval(app.id, users.officer);
    const approved = await applicationService.approveApplication(app.id, users.approver, 'Meets requirements');
    expect(approved.status).toBe(APPLICATION_STATUS.APPROVED);
  });

  test('role cannot be assigned both review and approve permissions', async () => {
    await expect(roleService.createRole({
      name: 'unsafe',
      permissionNames: [PERMISSIONS.REVIEW_APPLICATION, PERMISSIONS.APPROVE_APPLICATION]
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('same user cannot review and approve even if permissions allow it', async () => {
    const { Role, RolePermission, User, Permission } = global.testDb;
    // This role is created directly to bypass role service validation on purpose.
    const role = await Role.create({ name: 'unsafe-direct', description: 'unsafe' });
    const permissions = await Permission.findAll({
      where: { name: [PERMISSIONS.REVIEW_APPLICATION, PERMISSIONS.MARK_PENDING_APPROVAL, PERMISSIONS.APPROVE_APPLICATION, PERMISSIONS.VIEW_ALL_APPLICATIONS] }
    });
    for (const permission of permissions) {
      await RolePermission.create({ role_id: role.id, permission_id: permission.id });
    }
    const rawUser = await User.create({ full_name: 'Unsafe User', email: 'unsafe@test.local', password_hash: users.applicant.password_hash, role_id: role.id });
    const unsafeUser = await global.testDb.loadUserWithPermissions(rawUser.id);

    // Even with unsafe permissions, service must still block same-person decision.
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    await applicationService.startReview(app.id, unsafeUser);
    await applicationService.markPendingApproval(app.id, unsafeUser);
    await expect(applicationService.approveApplication(app.id, unsafeUser, 'ok')).rejects.toMatchObject({ statusCode: 403 });
  });
});
