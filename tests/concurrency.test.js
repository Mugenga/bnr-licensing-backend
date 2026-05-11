const applicationService = require('../src/domains/applications/applications.service');

describe('concurrent final decisions', () => {
  let users;

  beforeEach(async () => {
    ({ users } = await global.testDb.seedTestData());
  });

  test('only one final decision succeeds', async () => {
    const { Application, AuditLog } = global.testDb;
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    await applicationService.startReview(app.id, users.officer);
    await applicationService.markPendingApproval(app.id, users.officer);

    const results = await Promise.allSettled([
      applicationService.approveApplication(app.id, users.approver, 'Approved'),
      applicationService.rejectApplication(app.id, users.approver, 'Rejected')
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const finalApplication = await Application.findByPk(app.id);
    expect(['approved', 'rejected']).toContain(finalApplication.status);

    const finalLogs = await AuditLog.findAll({
      where: { application_id: app.id, action: ['application_approved', 'application_rejected'] }
    });
    expect(finalLogs).toHaveLength(1);
  });
});
