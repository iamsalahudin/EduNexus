const util = require('util');

function info(...args) {
  console.log('[INFO]', util.format(...args));
}

function error(...args) {
  console.error('[ERROR]', util.format(...args));
}

function warn(...args) {
  console.warn('[WARN]', util.format(...args));
}

module.exports = { info, error, warn };
