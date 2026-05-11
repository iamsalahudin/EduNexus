<<<<<<< HEAD
﻿"use client"

import { useEffect, useMemo, useState } from 'react'
import TimetableSlotsBoard from '@/components/timetable/TimetableSlotsBoard'
import { Button, Card, PageHeader, Skeleton } from '@/components/ui'
import timetableService from '@/services/timetableService'

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emptyMessage, setEmptyMessage] = useState('')
  const [timetables, setTimetables] = useState([])

  async function load() {
    setLoading(true)
    setError('')
    setEmptyMessage('')
    try {
      const res = await timetableService.listTeacherPersonalTimetables()
      const list = Array.isArray(res?.timetables) ? res.timetables : []
      setTimetables(list)
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

  const totalSlots = useMemo(() => {
    if (!selectedTimetable) return 0
    return Array.isArray(selectedTimetable?.slots) ? selectedTimetable.slots.length : 0
  }, [selectedTimetable])

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Your personal teaching timetable across assigned classes."
        right={<Button onClick={load} disabled={loading}>Refresh</Button>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Visible Timetables</div>
          <div className="text-xl font-semibold mt-1">{loading ? '...' : timetables.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Periods in Selection</div>
          <div className="text-xl font-semibold mt-1">{loading ? '...' : totalSlots}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Access</div>
          <div className="text-sm mt-2">Read-only</div>
        </Card>
      </div>

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : timetables.length === 0 ? (
          <div className="text-sm text-gray-600">{emptyMessage || 'No timetable currently linked to your assignments.'}</div>
        ) : (
          <div className="space-y-4">
            {timetables.length > 1 ? (
              <div className="text-xs text-gray-500">
                Multiple relevant timetables found. Showing the most relevant active timetable automatically.
              </div>
            ) : null}
            {selectedTimetable ? <TimetableSlotsBoard timetable={selectedTimetable} viewRole="teacher" /> : null}
          </div>
        )}
      </Card>
    </div>
  )
}
=======
﻿"use client"

import { useEffect, useMemo, useState } from 'react'
import TimetableSlotsBoard from '@/components/timetable/TimetableSlotsBoard'
import { Button, Card, PageHeader, Skeleton } from '@/components/ui'
import timetableService from '@/services/timetableService'

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emptyMessage, setEmptyMessage] = useState('')
  const [timetables, setTimetables] = useState([])

  async function load() {
    setLoading(true)
    setError('')
    setEmptyMessage('')
    try {
      const res = await timetableService.listTeacherPersonalTimetables()
      const list = Array.isArray(res?.timetables) ? res.timetables : []
      setTimetables(list)
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

  const totalSlots = useMemo(() => {
    if (!selectedTimetable) return 0
    return Array.isArray(selectedTimetable?.slots) ? selectedTimetable.slots.length : 0
  }, [selectedTimetable])

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Your personal teaching timetable across assigned classes."
        right={<Button onClick={load} disabled={loading}>Refresh</Button>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Visible Timetables</div>
          <div className="text-xl font-semibold mt-1">{loading ? '...' : timetables.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Periods in Selection</div>
          <div className="text-xl font-semibold mt-1">{loading ? '...' : totalSlots}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Access</div>
          <div className="text-sm mt-2">Read-only</div>
        </Card>
      </div>

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : timetables.length === 0 ? (
          <div className="text-sm text-gray-600">{emptyMessage || 'No timetable currently linked to your assignments.'}</div>
        ) : (
          <div className="space-y-4">
            {timetables.length > 1 ? (
              <div className="text-xs text-gray-500">
                Multiple relevant timetables found. Showing the most relevant active timetable automatically.
              </div>
            ) : null}
            {selectedTimetable ? <TimetableSlotsBoard timetable={selectedTimetable} viewRole="teacher" /> : null}
          </div>
        )}
      </Card>
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
