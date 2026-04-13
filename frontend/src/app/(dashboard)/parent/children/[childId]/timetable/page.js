"use client"

import { useEffect, useMemo, useState } from 'react'
import TimetableSlotsBoard from '@/components/timetable/TimetableSlotsBoard'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import timetableService from '@/services/timetableService'

export default function Page({ params }) {
  const initialChildId = String(params?.childId || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emptyMessage, setEmptyMessage] = useState('')

  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(initialChildId)

  const [selectedTimetableId, setSelectedTimetableId] = useState('')

  async function load(targetChildId = undefined) {
    setLoading(true)
    setError('')
    setEmptyMessage('')
    try {
      const res = await timetableService.listParentChildTimetables({
        isActive: true,
        status: 'active',
        ...(targetChildId ? { childId: targetChildId } : {})
      })

      const list = Array.isArray(res?.children) ? res.children : []
      setChildren(list)
      setEmptyMessage(String(res?.meta?.message || ''))

      if (!list.length) {
        setSelectedChildId('')
        setSelectedTimetableId('')
        return
      }

      const resolvedChildId = String(res?.selectedChildId || list[0]?.childId || '')
      setSelectedChildId(resolvedChildId)

      const selectedChild = list.find((child) => String(child?.childId) === resolvedChildId) || list[0]
      const firstTimetableId = String(selectedChild?.timetables?.[0]?._id || '')
      setSelectedTimetableId(firstTimetableId)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load timetable')
      setChildren([])
      setSelectedChildId('')
      setSelectedTimetableId('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(initialChildId || undefined)
  }, [initialChildId])

  const selectedChild = useMemo(() => {
    if (!selectedChildId) return null
    return children.find((child) => String(child?.childId) === String(selectedChildId)) || null
  }, [children, selectedChildId])

  const childTimetables = useMemo(() => {
    return Array.isArray(selectedChild?.timetables) ? selectedChild.timetables : []
  }, [selectedChild])

  useEffect(() => {
    if (!selectedChildId) return
    const child = children.find((item) => String(item?.childId) === String(selectedChildId))
    const firstId = String(child?.timetables?.[0]?._id || '')
    setSelectedTimetableId(firstId)
  }, [selectedChildId, children])

  const selectedTimetable = useMemo(() => {
    if (!selectedTimetableId) return null
    return childTimetables.find((t) => String(t?._id) === String(selectedTimetableId)) || null
  }, [selectedTimetableId, childTimetables])

  async function onChildChange(nextChildId) {
    setSelectedChildId(nextChildId)
    await load(nextChildId)
  }

  return (
    <div>
      <PageHeader
        title="Child Timetable"
        subtitle="View each child's timetable separately."
        right={<Button onClick={() => load(selectedChildId || undefined)} disabled={loading}>Refresh</Button>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : children.length === 0 ? (
          <div className="text-sm text-gray-600">{emptyMessage || 'No linked children found.'}</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <div className="text-sm font-medium mb-2">Child</div>
                <div className="flex flex-wrap gap-2">
                  {children.map((child) => {
                    const childId = String(child?.childId || '')
                    const isActive = String(selectedChildId) === childId
                    return (
                      <button
                        key={childId}
                        type="button"
                        onClick={() => onChildChange(childId)}
                        className={`px-3 py-2 rounded border text-sm transition ${
                          isActive
                            ? 'bg-theme-primary text-white border-theme-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover-theme-primary'
                        }`}
                      >
                        {child?.studentId || '—'} - {child?.name || 'Student'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Select label="Class" value={selectedChild?.class || ''} disabled>
                <option value="">—</option>
                {selectedChild?.class ? <option value={selectedChild.class}>{selectedChild.class}</option> : null}
              </Select>

              <Select label="Section" value={selectedChild?.section || ''} disabled>
                <option value="">—</option>
                {selectedChild?.section ? <option value={selectedChild.section}>{selectedChild.section}</option> : null}
              </Select>
            </div>

            {childTimetables.length === 0 ? (
              <div className="text-sm text-gray-600">No timetable till now for this child.</div>
            ) : (
              <div className="space-y-4">
                <Select
                  label="Timetable"
                  value={selectedTimetableId}
                  onChange={(e) => setSelectedTimetableId(e.target.value)}
                >
                  {childTimetables.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t?.level || '—'} · {t?.year || '—'}
                    </option>
                  ))}
                </Select>

                {selectedTimetable ? <TimetableSlotsBoard timetable={selectedTimetable} viewRole="parent" /> : null}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
