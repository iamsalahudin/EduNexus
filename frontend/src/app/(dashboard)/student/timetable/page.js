"use client"

import { useEffect, useMemo, useState } from 'react'
import TimetableSlotsBoard from '@/components/timetable/TimetableSlotsBoard'
import { Button, Card, PageHeader, Skeleton } from '@/components/ui'
import timetableService from '@/services/timetableService'

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emptyMessage, setEmptyMessage] = useState('')
  const [scope, setScope] = useState({ class: '', section: '' })
  const [timetables, setTimetables] = useState([])

  async function load() {
    setLoading(true)
    setError('')
    setEmptyMessage('')
    try {
      const res = await timetableService.listStudentClassTimetables({ isActive: true, status: 'active' })
      const list = Array.isArray(res?.timetables) ? res.timetables : []
      setTimetables(list)
      setScope(res?.scope || { class: '', section: '' })
      setEmptyMessage(String(res?.meta?.message || ''))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectedTimetable = useMemo(() => {
    if (!timetables.length) return null
    return timetables[0] || null
  }, [timetables])

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Your class timetable and period details."
        right={<Button onClick={load} disabled={loading}>Refresh</Button>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      {(scope?.class || scope?.section) ? (
        <div className="mt-4 text-sm text-gray-600">
          Class: <span className="font-medium text-gray-900">{scope?.class || '—'}</span>
          {' · '}
          Section: <span className="font-medium text-gray-900">{scope?.section || '—'}</span>
        </div>
      ) : null}

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : timetables.length === 0 ? (
          <div className="text-sm text-gray-600">{emptyMessage || 'No timetable available for your class yet.'}</div>
        ) : (
          <div className="space-y-4">
            {timetables.length > 1 ? (
              <div className="text-xs text-gray-500">
                Multiple relevant timetables found. Showing the most relevant active timetable automatically.
              </div>
            ) : null}
            {selectedTimetable ? <TimetableSlotsBoard timetable={selectedTimetable} viewRole="student" /> : null}
          </div>
        )}
      </Card>
    </div>
  )
}
