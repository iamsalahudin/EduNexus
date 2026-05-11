const { ReportCard } = require('../models');
const logger = require('../utils/logger');

<<<<<<< HEAD
const MAX_TIMEOUT_MS = 2147483647;

=======
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
function shouldEnableReportCardArchiveScheduler() {
  if (process.env.NODE_ENV === 'test') return false;
  if (String(process.env.REPORT_CARD_ARCHIVE_SCHEDULER_DISABLED || '').toLowerCase() === 'true') return false;
  return true;
}

function parseYearsToKeep() {
  const raw = parseInt(process.env.REPORT_CARD_ARCHIVE_YEARS_TO_KEEP || '3', 10);
  if (!Number.isFinite(raw) || raw < 1) return 3;
  return raw;
}

function getNextMonthlyRun(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 20, 0, 0);
}

async function runReportCardArchival() {
  const yearsToKeep = parseYearsToKeep();
  const cutoffYear = new Date().getFullYear() - yearsToKeep;

  const result = await ReportCard.updateMany(
    {
      status: 'published',
      year: { $lte: cutoffYear },
      archived: { $ne: true }
    },
    {
      $set: {
        archived: true,
        archivedAt: new Date()
      }
    }
  );

  logger.info(
    `Report card archival completed for cutoffYear=${cutoffYear}, archived=${result.modifiedCount || 0}`
  );

  return {
    yearsToKeep,
    cutoffYear,
    archivedCount: result.modifiedCount || 0
  };
}

function startReportCardArchiveScheduler() {
  if (!shouldEnableReportCardArchiveScheduler()) {
    return null;
  }

  let timer = null;

  const scheduleNext = () => {
    const now = new Date();
    const nextRun = getNextMonthlyRun(now);
<<<<<<< HEAD
    const delay = nextRun.getTime() - now.getTime();
    const safeDelay = Math.min(MAX_TIMEOUT_MS, Math.max(1000, delay));
    const shouldRun = delay <= MAX_TIMEOUT_MS;

    timer = setTimeout(async () => {
      if (!shouldRun) {
        scheduleNext();
        return;
      }

=======
    const delay = Math.max(1000, nextRun.getTime() - now.getTime());

    timer = setTimeout(async () => {
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
      try {
        await runReportCardArchival();
      } catch (error) {
        logger.error('Report card archival scheduler failed', error);
      } finally {
        scheduleNext();
      }
<<<<<<< HEAD
    }, safeDelay);
=======
    }, delay);
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854

    if (timer && typeof timer.unref === 'function') {
      timer.unref();
    }
  };

  scheduleNext();

  return {
    stop() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
    runNow: runReportCardArchival
  };
}

module.exports = {
  startReportCardArchiveScheduler,
  runReportCardArchival,
  getNextMonthlyRun,
  shouldEnableReportCardArchiveScheduler,
  parseYearsToKeep
};