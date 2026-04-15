"use client"

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import { fetchStudentAttendance } from '@/services/attendanceService'
import { api } from '@/services/api'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function PrincipalStudentAttendanceDetailPage() {
  const params = useParams()
  const studentId = String(params?.studentId || '')

  const [student, setStudent] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const toDate = toInputDate(new Date())
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        const fromDate = toInputDate(sixMonthsAgo)

        const attendanceRes = await fetchStudentAttendance({ studentId, fromDate, toDate })
        const attendanceRecords = attendanceRes?.records || []

        let profile = null
        try {
          const studentRes = await api.get(`/students/${studentId}`)
          profile = studentRes?.data?.student || studentRes?.data || null
        } catch (e) {
          const firstRecord = attendanceRecords[0]
          profile = firstRecord?.student || null
        }

        if (!mounted) return
        setStudent(profile)
        setRecords(attendanceRecords)
      } catch (e) {
        if (mounted) setError(e?.response?.data?.error || e.message || 'Failed to load student attendance detail')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (studentId) load()
    return () => {
      mounted = false
    }
  }, [studentId])

  const stats = useMemo(() => {
    const total = records.length
    const present = records.filter((r) => String(r.status).toLowerCase() === 'present').length
    const absent = records.filter((r) => {
      const s = String(r.status).toLowerCase()
      return s === 'absent' || s === 'late'
    }).length
    const leave = records.filter((r) => {
      const s = String(r.status).toLowerCase()
      return s === 'leave' || s === 'excused'
    }).length
    const percentage = total ? ((present / total) * 100).toFixed(1) : '0.0'
    return { total, present, absent, leave, percentage: Number(percentage) }
  }, [records])

  const monthly = useMemo(() => {
    const byMonth = new Map()
    for (const record of records) {
      const month = String(record?.date || '').slice(0, 7)
      if (!month) continue
      if (!byMonth.has(month)) byMonth.set(month, { total: 0, present: 0 })
      const curr = byMonth.get(month)
      curr.total += 1
      if (String(record.status || '').toLowerCase() === 'present') curr.present += 1
    }

    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, values]) => ({
        month,
        percentage: values.total ? Math.round((values.present / values.total) * 100) : 0,
        total: values.total,
      }))
  }, [records])

  const maxMonthly = Math.max(...monthly.map((m) => m.percentage), 1)

  return (
    <div>
      <PageHeader
        title="Student Attendance Detail"
        subtitle={student?.name ? `Attendance profile for ${student.name}` : 'Attendance profile'}
        right={<ButtonLink href="/principal/attendance/students" variant="secondary">Back</ButtonLink>}
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
          <Skeleton className="h-56" />
        </div>
      ) : (
        <>
          <Card className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Name</p>
                <p className="font-semibold">{student?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Class</p>
                <p className="font-semibold">{student?.class?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Section</p>
                <p className="font-semibold">{student?.section || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Attendance %</p>
                <p className="font-semibold text-blue-700">{stats.percentage.toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><p className="text-sm text-gray-500">Total</p><p className="text-xl font-semibold">{stats.total}</p></Card>
            <Card><p className="text-sm text-gray-500">Present</p><p className="text-xl font-semibold text-green-700">{stats.present}</p></Card>
            <Card><p className="text-sm text-gray-500">Absent</p><p className="text-xl font-semibold text-red-700">{stats.absent}</p></Card>
            <Card><p className="text-sm text-gray-500">Leave</p><p className="text-xl font-semibold text-amber-700">{stats.leave}</p></Card>
          </div>

          <Card className="mt-6">
            <h3 className="font-semibold mb-4">Monthly Attendance Graph</h3>
            {monthly.length === 0 ? (
              <p className="text-sm text-gray-600">No monthly data available.</p>
            ) : (
              <div className="space-y-3">
                {monthly.map((m) => (
                  <div key={m.month} className="grid grid-cols-[80px_1fr_55px] items-center gap-3">
                    <span className="text-xs text-gray-500">{m.month}</span>
                    <div className="h-3 bg-gray-200 rounded-full">
                      <div className="h-3 bg-blue-600 rounded-full" style={{ width: `${Math.round((m.percentage / maxMonthly) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-semibold">{m.percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="mt-6">
            <h3 className="font-semibold mb-4">Attendance History</h3>
            <div className="overflow-auto">
              {records.length === 0 ? (
                <p className="text-sm text-gray-600">No attendance history found.</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record._id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-4">{String(record.date).slice(0, 10)}</td>
                        <td className="py-3 px-4">{record.status || '-'}</td>
                        <td className="py-3 px-4">{record.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
