const nodemailer = require('nodemailer');
const env = require('../../config/env');

function missingSmtpConfig() {
  return !env.email.host || !env.email.port || !env.email.user || !env.email.password;
}

async function sendEmail({ to, subject, text, html }) {
  // Local dev can keep email off and workflow should still continue.
  if (!env.email.enabled) {
    return { skipped: true, reason: 'Email is disabled' };
  }

  // If env is not ready, skip instead of crashing workflow.
  if (missingSmtpConfig()) {
    return { skipped: true, reason: 'Email is not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.email.host,
      port: Number(env.email.port),
      secure: env.email.secure,
      auth: {
        user: env.email.user,
        pass: env.email.password
      }
    });

    await transporter.sendMail({ from: env.email.from, to, subject, text, html });
    return { sent: true };
  } catch (error) {
    // Failed SMTP should be reported as value, not thrown.
    return { failed: true, error: error.message };
  }
}

module.exports = { sendEmail };
