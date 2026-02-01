import axios from '@/services/api';

/**
 * Send message to backend chat API (which forwards to n8n agent)
 * Backend route: POST /api/chat (protected with auth middleware)
 */
export async function sendToApi({ conversationId, message }) {
  const maxAttempts = 3;
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.post('/chat', {
        message,
        sessionId: conversationId,
      });

      return {
        reply: response.data.reply,
        data: response.data.data || null,
        chart: response.data.data?.type === 'chart' ? response.data.data : null,
        actions: response.data.actions || [],
        sources: response.data.sources || [],
      };
    } catch (error) {
      const status = error.response?.status;
      const isRetryable = status === 503 || status === 504 || status === 429;
      if (attempt < maxAttempts && isRetryable) {
        await delay(750 * attempt);
        continue;
      }

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Unable to connect to agent. Please try again.';

      return {
        reply: errorMessage,
        error: true,
        retry: isRetryable && attempt < maxAttempts,
      };
    }
  }
}

// GET /api/chat/sessions
export async function fetchSessions() {
  const res = await axios.get('/chat/sessions');
  return res.data || [];
}

// GET /api/chat/sessions/:sessionKey/messages
export async function fetchMessages(sessionKey) {
  const res = await axios.get(`/chat/sessions/${sessionKey}/messages`);
  return res.data || { session: null, messages: [] };
}

