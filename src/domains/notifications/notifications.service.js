const { User } = require('../../db/models');
const emailService = require('./email.service');
const templates = require('./notificationTemplates');

async function deliver(application, template) {
  try {
    const applicant = application.Applicant || await User.findByPk(application.applicant_user_id);
    if (!applicant?.email) return { skipped: true, reason: 'Applicant email is missing' };

    const result = await emailService.sendEmail({ to: applicant.email, ...template });
    if (result.skipped || result.failed) {
      console.warn('Notification not sent', result);
    }
    return result;
  } catch (error) {
    console.warn('Notification failed', { error: error.message });
    return { failed: true, error: error.message };
  }
}

const notifyApplicationSubmitted = (application) => deliver(application, templates.submitted(application));
const notifyAdditionalDocumentsRequested = (application, message) => deliver(application, templates.additionalDocumentsRequested(application, message));
const notifyApplicationResubmitted = (application) => deliver(application, templates.resubmitted(application));
const notifyApplicationPendingApproval = async () => ({ skipped: true, reason: 'No applicant notification for internal pending approval step' });
const notifyApplicationApproved = (application, note) => deliver(application, templates.approved(application, note));
const notifyApplicationRejected = (application, note) => deliver(application, templates.rejected(application, note));

module.exports = {
  notifyApplicationSubmitted,
  notifyAdditionalDocumentsRequested,
  notifyApplicationResubmitted,
  notifyApplicationPendingApproval,
  notifyApplicationApproved,
  notifyApplicationRejected
};
