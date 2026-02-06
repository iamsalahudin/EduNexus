const logger = require('./logger');
const { getClient, ensureReady } = require('./redisClient');

/**
 * Redis-backed cache with graceful degradation.
 * Values are JSON-serialized.
 */
async function get(key) {
  try {
    const ready = await ensureReady();
    if (!ready) return null;
    const client = getClient();
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    logger.error('[REDIS][CACHE] get error', err.message);
    return null;
  }
}

async function set(key, value, ttlMs) {
  try {
    const ready = await ensureReady();
    if (!ready) return false;
    const client = getClient();
    const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000));
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return true;
  } catch (err) {
    logger.error('[REDIS][CACHE] set error', err.message);
    return false;
  }
}

module.exports = { get, set };
