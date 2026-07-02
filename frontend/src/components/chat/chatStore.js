// simple localStorage persistence
const STORAGE_KEY = 'ims_chat_conversations_v1';

export function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export function loadConversations() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {}
}
