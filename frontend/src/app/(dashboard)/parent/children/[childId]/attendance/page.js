'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import StudentAttendanceRecordsView from '@/components/attendance/StudentAttendanceRecordsView'
import timetableService from '@/services/timetableService'

export default function ChildAttendancePage() {
  const params = useParams()
  const initialChildId = String(params?.childId || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(initialChildId)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await timetableService.listParentChildTimetables({ childId: initialChildId || undefined })
        if (!mounted) return

        const list = Array.isArray(res?.children) ? res.children : []
        setChildren(list)
        setSelectedChildId(String(res?.selectedChildId || initialChildId || list[0]?.childId || ''))
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.error || e.message || 'Failed to load child attendance data')
          setChildren([])
          setSelectedChildId(initialChildId)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [initialChildId])

  const selectedChild = children.find((item) => String(item?.childId) === String(selectedChildId)) || children[0] || null

  return (
    <div>
      <PageHeader
        title="Child's Attendance"
        subtitle="Monitor each child separately with the same attendance view and export tools."
        right={<ButtonLink href="/parent" variant="secondary">Back to Dashboard</ButtonLink>}
      />

      {error ? <Card className="mt-6 bg-red-50 border border-red-200"><div className="text-sm text-red-700">{error}</div></Card> : null}

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-gray-900">Child Toggle</div>
            <div className="text-xs text-gray-500">Switch between linked children from this page.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => {
              const active = String(selectedChildId) === String(child?.childId)
              return (
                <button
                  key={child.childId}
                  type="button"
                  onClick={() => setSelectedChildId(String(child.childId))}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    active
                      ? 'border-theme-primary bg-theme-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover-theme-primary'
                  }`}
                >
                  {child?.studentId || '—'} - {child?.name || 'Student'}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? <Skeleton className="mt-4 h-24" /> : null}
      </Card>

      <div className="mt-6">
        <StudentAttendanceRecordsView
          title={selectedChild?.name ? `${selectedChild.name}'s Attendance` : "Child's Attendance"}
          description={selectedChild?.class ? `Class ${selectedChild.class}${selectedChild.section ? ` - Section ${selectedChild.section}` : ''}` : 'Complete attendance history for the selected child.'}
          showClassFilter={false}
          studentId={selectedChildId}
        />
      </div>
    </div>
  )
}
