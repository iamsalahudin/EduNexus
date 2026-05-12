const { ensureMonthlyFeesGenerated } = require('../controllers/feeController')
const logger = require('../utils/logger')

const MAX_TIMEOUT_MS = 2147483647

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
    const delay = nextRun.getTime() - now.getTime()
    const safeDelay = Math.min(MAX_TIMEOUT_MS, Math.max(1000, delay))
    const shouldRun = delay <= MAX_TIMEOUT_MS

    timer = setTimeout(async () => {
      if (!shouldRun) {
        scheduleNext()
        return
      }

      try {
        await runMonthlyFeeGeneration()
      } catch (error) {
        logger.error('Monthly fee generation scheduler failed', error)
      } finally {
        scheduleNext()
      }
    }, safeDelay)

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