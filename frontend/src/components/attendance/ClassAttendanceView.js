"use client"

import { useEffect, useState, useCallback } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import api, { invalidateApiCache } from '@/services/api'
import { useAgentDataChanged } from '@/hooks/useAgentDataChanged'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function ClassAttendanceView({
  title = 'Class-wise Attendance',
  subtitle = 'View attendance statistics by class and section.',
  backHref = '/admin/attendance',
}) {
  const [date, setDate] = useState(toInputDate(new Date()))
  const [classes, setClasses] = useState([])
  const [classStats, setClassStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => {
    invalidateApiCache('/attendance')
    setReloadKey((n) => n + 1)
  }, [])
  useAgentDataChanged(refresh, ['attendances', 'students'])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [classesRes, overviewRes] = await Promise.all([
          classesService.listClasses({ active: true }, { signal: controller.signal }),
          api.get('/attendance/class-overview', { params: { date }, signal: controller.signal }),
        ])
        if (cancelled) return
        const classList = Array.isArray(classesRes?.classes) ? classesRes.classes : []
        setClasses(classList)
        const overview = Array.isArray(overviewRes?.data?.overview) ? overviewRes.data.overview : []
        const byName = new Map(overview.map((r) => [String(r.class), r]))
        const stats = {}
        for (const cls of classList) {
          const r = byName.get(String(cls.name)) || { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 }
          stats[cls._id] = r
        }
        setClassStats(stats)
      } catch (e) {
        if (cancelled || controller.signal.aborted) return
        const isAbort = e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || /canceled/i.test(String(e?.message || ''))
        if (isAbort) return
        setError(e?.response?.data?.error || e.message || 'Failed to load class data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [date, reloadKey])

  const maxDate = toInputDate(new Date())

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={(
          <ButtonLink href={backHref} variant="secondary">
            Back
          </ButtonLink>
        )}
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <div className="flex items-end gap-4">
          <Input
            label="Select Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={maxDate}
            className="max-w-sm"
          />
          <p className="text-sm text-gray-500">Showing attendance for: <strong>{date}</strong></p>
        </div>
      </Card>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : classes.length === 0 ? (
        <Card className="mt-6 bg-blue-50 border border-blue-200">
          <p className="text-center text-blue-600 text-sm">No active classes found.</p>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => {
            const stat = classStats[cls._id] || { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 }
            return (
              <Card key={cls._id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                    {cls.sections && <p className="text-sm text-gray-500">Sections: {cls.sections.join(', ')}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[--color-primary]">{stat.percentage}%</div>
                    <p className="text-xs text-gray-500">Attendance Rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="text-sm font-semibold text-blue-700">{stat.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="text-sm font-semibold text-green-700">{stat.present}</div>
                    <div className="text-xs text-gray-600">Present</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="text-sm font-semibold text-red-700">{stat.absent}</div>
                    <div className="text-xs text-gray-600">Absent</div>
                  </div>
                  <div className="bg-amber-50 p-2 rounded text-center">
                    <div className="text-sm font-semibold text-amber-700">{stat.late}</div>
                    <div className="text-xs text-gray-600">Late</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold">{stat.percentage}%</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
