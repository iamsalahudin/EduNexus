const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Send user message to n8n agent
 * n8n webhook must return: { reply: string, data?: object, actions?: array }
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const user = req.user; // From auth middleware

    // Validate input
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
    }

    // Validate user is authenticated
    if (!user || !user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Build payload for n8n with user credentials & context
    const n8nPayload = {
      sessionId: sessionId || user.id,
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Call n8n webhook
    // IMPORTANT: Store your n8n webhook URL in environment variables
    const N8N_WEBHOOK_URL = process.env.N8N_CHAT_WEBHOOK_URL;
    if (!N8N_WEBHOOK_URL) {
      logger.error('N8N_CHAT_WEBHOOK_URL not configured');
      return res.status(500).json({ error: 'Chat service not available' });
    }

    logger.info(`[CHAT] User ${user.id} (${user.role}): ${message.substring(0, 100)}`);

    // Call n8n with 30 second timeout
    const n8nResponse = await axios.post(N8N_WEBHOOK_URL, n8nPayload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Log what n8n actually returned for debugging
    logger.info('[CHAT] n8n raw response:', JSON.stringify(n8nResponse.data, null, 2));

    // Validate n8n response shape
    if (!n8nResponse.data || !n8nResponse.data.reply) {
      logger.error('Invalid n8n response format. Expected { reply: "..." }. Got:', n8nResponse.data);
      return res.status(500).json({ error: 'Invalid response from agent' });
    }

    // Return response to frontend
    res.json({
      reply: n8nResponse.data.reply,
      data: n8nResponse.data.data || null,
      actions: n8nResponse.data.actions || [],
      sources: n8nResponse.data.sources || []
    });

  } catch (error) {
    logger.error('[CHAT ERROR]', error.message);
    
    // Log full error details for debugging
    if (error.response) {
      logger.error('[CHAT ERROR] n8n Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Agent service unavailable. Try again later.' });
    }

    if (error.response?.status === 400) {
      return res.status(400).json({ error: error.response.data?.message || 'Invalid query' });
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(504).json({ error: 'Agent took too long to respond. Try a simpler question.' });
    }

    res.status(500).json({ error: 'Failed to process your query' });
  }
};
