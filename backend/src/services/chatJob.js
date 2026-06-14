const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Core chat processing logic. Called by the queue worker.
 * @param {object} payload - n8n payload containing session/user/message details
 * @param {object} options - optional request options
 * @param {AbortSignal} options.signal - abort signal to cancel the n8n request
 * @returns {Promise<{reply: string, data: any, actions: any[], sources: any[]}>}
 */
async function processChat(payload, options = {}) {
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
      signal: options.signal,
    });

    logger.info('[CHAT][JOB] n8n raw response:', JSON.stringify(response.data, null, 2));

    // Flexible extraction to support different n8n node output shapes.
    const extractReply = (data) => {
      if (data === null || data === undefined) return null;
      if (typeof data === 'string') return data;
      if (typeof data === 'number' || typeof data === 'boolean') return String(data);
      // n8n often returns an array of items: [ { output: '...' } ]
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const payload = first?.json ?? first;
        if (payload === null || payload === undefined) return null;
        if (typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean') {
          return String(payload);
        }
        return payload.reply || payload.output || payload.text || payload.answer || null;
      }
      if (typeof data === 'object') {
        return data.reply || data.output || data.text || data.answer || (data.data && data.data.reply) || null;
      }
      return null;
    };

    const reply = extractReply(response.data);
    if (!reply) {
      // The webhook returned 200 but no usable reply. This usually means a downstream Code node
      // threw and n8n's "Continue on Fail" swallowed it. Try to extract an error message from
      // the response body so the user sees something useful instead of a generic message.
      const extractError = (data) => {
        if (!data) return null;
        if (typeof data === 'string') return data;
        if (Array.isArray(data) && data.length) {
          const first = data[0]?.json ?? data[0];
          return first?.error || first?.message || first?.errorMessage || null;
        }
        if (typeof data === 'object') {
          return data.error || data.message || data.errorMessage || data.details?.errorMessage || null;
        }
        return null;
      };
      const errMsg = extractError(response.data);
      return {
        reply: errMsg ? `Agent error: ${errMsg}` : 'The agent did not return a reply. Please rephrase your request or check the n8n workflow logs.',
        data: null,
        actions: [],
        sources: [],
        attachments: [],
        agentError: true,
      };
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
    if (err?.code === 'ERR_CANCELED') {
      logger.warn('[CHAT][JOB] request aborted by client');
      throw err;
    }
    logger.error('[CHAT][JOB] failed to POST to n8n webhook:', err.message);
    if (err.response) {
      logger.error('[CHAT][JOB] n8n response:', {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
      });

      const status = err.response.status;
      if (status >= 400) {
        const body = err.response.data;
        let reply = null;
        if (typeof body === 'string' && body.trim()) reply = body.trim();
        else if (body && typeof body === 'object') {
          if (Array.isArray(body) && body.length) {
            const first = body[0]?.json ?? body[0];
            reply = first?.error || first?.message || first?.errorMessage || null;
          }
          if (!reply) reply = body.reply || body.answer || body.error || body.message
            || body.errorMessage || body.details?.errorMessage || null;
        }
        if (!reply) {
          reply = status >= 500
            ? `The agent's workflow failed (status ${status}). Please rephrase your request or check the n8n logs for the failing node.`
            : `Request not allowed (status ${status}).`;
        }
        return {
          reply,
          data: null,
          actions: [],
          sources: [],
          attachments: [],
          agentDenied: true,
          statusCode: status,
        };
      }
    } else {
      logger.error('[CHAT][JOB] no HTTP response received (network/DNS/SSL/proxy?)');
    }
    throw err;
  }
}

module.exports = { processChat };
