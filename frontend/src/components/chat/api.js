import axios from '@/services/api';

/**
 * Send message to backend chat API (which forwards to n8n agent)
 * Backend route: POST /api/chat (protected with auth middleware)
 */
export async function sendToApi({ conversationId, message }) {
  try {
    const response = await axios.post('/chat', {
      message,
      sessionId: conversationId
    });

    return {
      reply: response.data.reply,
      data: response.data.data || null,
      chart: response.data.data?.type === 'chart' ? response.data.data : null,
      actions: response.data.actions || [],
      sources: response.data.sources || []
    };
  } catch (error) {
    const errorMessage = 
      error.response?.data?.error || 
      error.message ||
      'Unable to connect to agent. Please try again.';
    
    return {
      reply: errorMessage,
      error: true,
      retry: true
    };
  }
}

