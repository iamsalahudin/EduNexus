const nodemailer = require('nodemailer');

let cachedTransporter = null;

function getTransporterConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return { host, port, user, pass };
}

function isConfigured() {
  const { host, user, pass } = getTransporterConfig();
  return Boolean(host && user && pass);
}

function getTransporter() {
  const { host, port, user, pass } = getTransporterConfig();
  if (!host || !user || !pass) {
    return null;
  }

  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return cachedTransporter;
}

function ensureMailerConfigured() {
  const transporter = getTransporter();
  if (!transporter) {
    const requiredKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
    const missing = requiredKeys.filter((key) => !String(process.env[key] || '').trim());
    const err = new Error(
      `Email service is not configured. Missing: ${missing.join(', ')}. ` +
      'Add these to backend/.env and restart the backend server.'
    );
    err.status = 500;
    throw err;
  }
  return transporter;
}

async function sendMail({ to, subject, html, text, from }) {
  const transporter = ensureMailerConfigured();

  await transporter.sendMail({
    from: from || process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text
  });
}

function buildWelcomeCredentialsTemplate({ recipientName, roleLabel, email, username, temporaryPassword }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  return {
    subject: `Welcome to EduNexus - ${roleLabel} Account Created`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2>Welcome to EduNexus</h2>
        <p>Hello ${recipientName},</p>
        <p>Your ${roleLabel.toLowerCase()} account has been created.</p>
        <p><strong>Login Username:</strong> ${username || '-'}</p>
        <p><strong>Account Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        <p>Login here: <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>
        <p>Please change your password after your first login.</p>
      </div>
    `,
    text: [
      `Welcome to EduNexus`,
      `Hello ${recipientName},`,
      `Your ${roleLabel.toLowerCase()} account has been created.`,
      `Login Username: ${username || '-'}`,
      `Account Email: ${email}`,
      `Temporary Password: ${temporaryPassword}`,
      `Login URL: ${frontendUrl}/login`,
      `Please change your password after your first login.`
    ].join('\n')
  };
}

async function sendWelcomeCredentialsEmail({
  to,
  recipientName,
  roleLabel,
  username,
  temporaryPassword
}) {
  const template = buildWelcomeCredentialsTemplate({
    recipientName,
    roleLabel,
    email: to,
    username,
    temporaryPassword
  });

  await sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

module.exports = {
  isConfigured,
  sendMail,
  sendWelcomeCredentialsEmail
};
