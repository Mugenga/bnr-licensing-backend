const nodemailer = require('nodemailer');
const env = require('../../config/env');

function missingSmtpConfig() {
  return !env.email.host || !env.email.port || !env.email.user || !env.email.password;
}

async function sendEmail({ to, subject, text, html }) {
  if (!env.email.enabled) {
    return { skipped: true, reason: 'Email is disabled' };
  }

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
    return { failed: true, error: error.message };
  }
}

module.exports = { sendEmail };
