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

  logger.info(`[CHAT][JOB] User ${payload.userId} (${payload.role}) -> ${payload.message.substring(0, 80)}`);
  logger.info('[CHAT][JOB] n8n webhook URL:', N8N_WEBHOOK_URL);

  try {
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' },
    });

    logger.info('[CHAT][JOB] n8n raw response:', JSON.stringify(response.data, null, 2));

    // Flexible extraction to support different n8n node output shapes.
    const extractReply = (data) => {
      if (!data) return null;
      if (typeof data === 'string') return data;
      // n8n often returns an array of items: [ { output: '...' } ]
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const payload = first.json || first;
        if (!payload) return null;
        return payload.reply || payload.output || payload.text || payload.answer || null;
      }
      if (typeof data === 'object') {
        return data.reply || data.output || data.text || (data.data && data.data.reply) || null;
      }
      return null;
    };

    const reply = extractReply(response.data);
    if (!reply) {
      throw new Error('Invalid response from agent: missing reply/output');
    }

    // Attempt to map commonly used fields from agent output
    const normalized = {
      reply,
      data: (response.data && response.data.data) || null,
      actions: (response.data && response.data.actions) || [],
      sources: (response.data && response.data.sources) || [],
      attachments: (response.data && response.data.attachments) || [],
    };

    // If response.data is an array and first element contains additional json fields, merge them
    if (Array.isArray(response.data) && response.data[0]) {
      const first = response.data[0].json || response.data[0];
      if (first) {
        normalized.data = normalized.data || first.data || null;
        normalized.actions = normalized.actions.length ? normalized.actions : (first.actions || []);
        normalized.sources = normalized.sources.length ? normalized.sources : (first.sources || []);
        normalized.attachments = normalized.attachments.length ? normalized.attachments : (first.attachments || []);
      }
    }

    return normalized;
  } catch (err) {
    logger.error('[CHAT][JOB] failed to POST to n8n webhook:', err.message);
    if (err.response) {
      logger.error('[CHAT][JOB] n8n response:', {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
      });
    } else {
      logger.error('[CHAT][JOB] no HTTP response received (network/DNS/SSL/proxy?)');
    }
    throw err;
  }
}

module.exports = { processChat };
