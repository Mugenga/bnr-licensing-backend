const env = require('../src/config/env');
const emailService = require('../src/domains/notifications/email.service');
const notifications = require('../src/domains/notifications/notifications.service');
const applicationService = require('../src/domains/applications/applications.service');

describe('notifications', () => {
  let users;

  beforeEach(async () => {
    jest.restoreAllMocks();
    env.email.enabled = false;
    env.email.host = '';
    env.email.port = '';
    env.email.user = '';
    env.email.password = '';
    ({ users } = await global.testDb.seedTestData());
  });

  test('email service skips when email is disabled', async () => {
    const result = await emailService.sendEmail({ to: 'a@test.local', subject: 'Hi', text: 'Hi' });
    expect(result).toEqual({ skipped: true, reason: 'Email is disabled' });
  });

  test('email service skips safely when SMTP config is missing', async () => {
    env.email.enabled = true;
    const result = await emailService.sendEmail({ to: 'a@test.local', subject: 'Hi', text: 'Hi' });
    expect(result).toEqual({ skipped: true, reason: 'Email is not configured' });
  });

  test('workflow action still succeeds when email sending fails', async () => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ failed: true, error: 'SMTP down' });
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    const submitted = await applicationService.submitApplication(app.id, users.applicant);
    expect(submitted.status).toBe('submitted');
  });

  test('approval notification attempts after successful approval', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ sent: true });
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    await applicationService.startReview(app.id, users.officer);
    await applicationService.markPendingApproval(app.id, users.officer);
    await applicationService.approveApplication(app.id, users.approver, 'Approved');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      to: users.applicant.email,
      subject: expect.stringContaining('Application approved')
    }));
  });

  test('additional documents notification includes officer message', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ sent: true });
    const app = await applicationService.createApplication({ institutionName: 'Bank A', licenseType: 'License' }, users.applicant);
    await applicationService.submitApplication(app.id, users.applicant);
    await applicationService.startReview(app.id, users.officer);
    await applicationService.requestDocuments(app.id, users.officer, 'Please upload audited statements');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Please upload audited statements')
    }));
  });
});
