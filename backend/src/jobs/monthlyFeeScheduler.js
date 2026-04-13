const { ensureMonthlyFeesGenerated } = require('../controllers/feeController')
const logger = require('../utils/logger')

function shouldEnableMonthlyFeeScheduler() {
  if (process.env.NODE_ENV === 'test') return false
  if (String(process.env.FEE_SCHEDULER_DISABLED || '').toLowerCase() === 'true') return false
  return true
}

function getNextMonthlyRun(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 5, 0, 0)
  return next
}

async function runMonthlyFeeGeneration() {
  const targetDate = new Date()
  const result = await ensureMonthlyFeesGenerated({ targetDate })
  logger.info(`Monthly fee generation completed for ${result.month} with ${result.createdCount} new rows.`)
  return result
}

function startMonthlyFeeScheduler() {
  if (!shouldEnableMonthlyFeeScheduler()) {
    return null
  }

  let timer = null

  const scheduleNext = () => {
    const now = new Date()
    const nextRun = getNextMonthlyRun(now)
    const delay = Math.max(1000, nextRun.getTime() - now.getTime())

    timer = setTimeout(async () => {
      try {
        await runMonthlyFeeGeneration()
      } catch (error) {
        logger.error('Monthly fee generation scheduler failed', error)
      } finally {
        scheduleNext()
      }
    }, delay)

    if (timer && typeof timer.unref === 'function') {
      timer.unref()
    }
  }

  scheduleNext()

  return {
    stop() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    runNow: runMonthlyFeeGeneration
  }
}

module.exports = {
  startMonthlyFeeScheduler,
  runMonthlyFeeGeneration,
  getNextMonthlyRun,
  shouldEnableMonthlyFeeScheduler
}