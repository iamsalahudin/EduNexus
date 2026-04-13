const { sendWelcomeCredentialsEmail: sendGenericWelcomeCredentialsEmail } = require('./mailService');

async function sendWelcomeCredentialsEmail({
  to,
  recipientName,
  roleLabel,
  username,
  temporaryPassword
}) {
  return sendGenericWelcomeCredentialsEmail({
    to,
    recipientName,
    roleLabel,
    username,
    temporaryPassword
  });
}

module.exports = {
  sendWelcomeCredentialsEmail
};
