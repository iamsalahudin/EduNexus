// Simple in-memory TTL cache
const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  const { value, expiresAt } = entry;
  if (Date.now() > expiresAt) {
    store.delete(key);
    return null;
  }
  return value;
}

function set(key, value, ttlMs) {
  const expiresAt = Date.now() + ttlMs;
  store.set(key, { value, expiresAt });
}

module.exports = { get, set };
