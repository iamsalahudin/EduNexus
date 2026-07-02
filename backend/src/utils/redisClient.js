const { createClient } = require('redis');
const logger = require('./logger');

const REDIS_URL = process.env.REDIS_URL;

let client;
let ready = false;
let connecting;

function getClient() {
  if (!REDIS_URL) return null;
  if (client) return client;

  client = createClient({ url: REDIS_URL });

  client.on('error', (err) => {
    ready = false;
    logger.error('[REDIS] error', err.message);
  });

  client.on('ready', () => {
    ready = true;
    logger.info('[REDIS] ready');
  });

  connecting = client.connect().catch((err) => {
    ready = false;
    logger.error('[REDIS] connect failed', err.message);
  });

  return client;
}

async function ensureReady() {
  if (!REDIS_URL) return false;
  const c = getClient();
  if (!c) return false;
  if (ready) return true;
  try {
    await connecting;
    return ready;
  } catch (err) {
    return false;
  }
}

module.exports = { getClient, ensureReady };
