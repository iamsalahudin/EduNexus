<<<<<<< HEAD
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
=======
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
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
}