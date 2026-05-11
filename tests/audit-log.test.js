const applicationService = require('../src/domains/applications/applications.service');
const auditService = require('../src/domains/audit/audit.service');

describe('audit logging', () => {
  let users;

  beforeEach(async () => {
    ({ users } = await global.testDb.seedTestData());
  });

  test('creates audit log when application is submitted', async () => {
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    const logs = await auditService.getApplicationAuditLogs(app.id, users.officer);
    expect(logs.some((log) => log.action === 'application_submitted')).toBe(true);
  });

  test('creates audit log when additional documents are requested', async () => {
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    await applicationService.startReview(app.id, users.officer);
    await applicationService.requestDocuments(app.id, users.officer, 'Upload statements');
    const logs = await auditService.getApplicationAuditLogs(app.id, users.officer);
    expect(logs.find((log) => log.action === 'additional_documents_requested').metadata.message).toBe('Upload statements');
  });

  test('applicant can see additional documents request message', async () => {
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    await applicationService.startReview(app.id, users.officer);
    await applicationService.requestDocuments(app.id, users.officer, 'Upload audited statements');

    const logs = await auditService.getApplicationAuditLogs(app.id, users.applicant);
    const requestLog = logs.find((log) => log.action === 'additional_documents_requested');

    expect(requestLog.metadata.message).toBe('Upload audited statements');
  });

  test('creates audit log when approved', async () => {
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    await applicationService.startReview(app.id, users.officer);
    await applicationService.markPendingApproval(app.id, users.officer);
    await applicationService.approveApplication(app.id, users.approver, 'Approved');
    const logs = await auditService.getApplicationAuditLogs(app.id, users.officer);
    expect(logs.some((log) => log.action === 'application_approved')).toBe(true);
  });

  test('direct update and delete fail for audit logs', async () => {
    const { AuditLog } = global.testDb;
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    const log = await AuditLog.findOne({ where: { application_id: app.id } });
    await expect(log.update({ action: 'tampered' })).rejects.toThrow('append-only');
    await expect(log.destroy()).rejects.toThrow('append-only');
  });
});
