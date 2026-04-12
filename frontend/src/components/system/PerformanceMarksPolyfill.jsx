'use client'

import { useEffect } from 'react'

export default function PerformanceMarksPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const perf = window.performance
    if (!perf) return

    if (typeof perf.clearMarks !== 'function') {
      perf.clearMarks = () => {}
    }

    if (typeof perf.clearMeasures !== 'function') {
      perf.clearMeasures = () => {}
    }
  }, [])

  return null
}