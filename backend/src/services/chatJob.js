const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Core chat processing logic. Called by the queue worker.
 * @param {object} payload - n8n payload containing session/user/message details
 * @returns {Promise<{reply: string, data: any, actions: any[], sources: any[]}>}
 */
async function processChat(payload) {
  const N8N_WEBHOOK_URL = process.env.N8N_CHAT_WEBHOOK_URL;
  if (!N8N_WEBHOOK_URL) {
    throw new Error('N8N_CHAT_WEBHOOK_URL not configured');
  }

  logger.info(
    `[CHAT][JOB] User ${payload.userId} (${payload.role}) -> ${payload.message.substring(0, 80)}`
  );

  const response = await axios.post(N8N_WEBHOOK_URL, payload, {
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  logger.info('[CHAT][JOB] n8n raw response:', JSON.stringify(response.data, null, 2));

  if (!response.data || !response.data.reply) {
    throw new Error('Invalid response from agent');
  }

  return {
    reply: response.data.reply,
    data: response.data.data || null,
    actions: response.data.actions || [],
    sources: response.data.sources || [],
  };
}

module.exports = { processChat };
