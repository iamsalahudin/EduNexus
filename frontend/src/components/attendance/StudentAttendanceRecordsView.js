"use client"

import { useEffect, useState } from 'react'
import Skeleton from '@/components/ui/Skeleton'
import { fetchStudentAttendance } from '@/services/attendanceService'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function StudentAttendanceRecordsView({ title = 'Student Attendance', description = 'View attendance records by class/date range.', showClassFilter = true } = {}) {
  const today = new Date()
  const [classId, setClassId] = useState('')
  const [fromDate, setFromDate] = useState(toInputDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14)))
  const [toDate, setToDate] = useState(toInputDate(today))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [records, setRecords] = useState([])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchStudentAttendance({ classId: classId || undefined, fromDate, toDate })
      setRecords(res.records || [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, fromDate, toDate])

  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-gray-600 mt-1">{description}</p>

      <div className="mt-6 card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {showClassFilter ? (
            <div>
              <label className="text-sm font-medium">Class (optional)</label>
              <input className="input mt-2" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g. 10" />
            </div>
          ) : null}
          <div>
            <label className="text-sm font-medium">From</label>
            <input className="input mt-2" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">To</label>
            <input className="input mt-2" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="px-3 py-2 border rounded hover-theme-primary" onClick={load} disabled={loading}>Refresh</button>
          </div>
        </div>
        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </div>

      <div className="mt-6 card">
        <h3 className="font-medium">Records</h3>
        <div className="mt-3 overflow-auto">
          {loading && records.length === 0 ? (
            <Skeleton className="h-40" />
          ) : records.length === 0 ? (
            <div className="text-sm text-gray-600">No records found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Marked By</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3">{String(r.date).slice(0, 10)}</td>
                    <td className="py-2 pr-3">{r.student?.firstName} {r.student?.lastName}</td>
                    <td className="py-2 pr-3">{r.class}{r.section ? `-${r.section}` : ''}</td>
                    <td className="py-2 pr-3">{r.status}</td>
                    <td className="py-2 pr-3">{r.teacher?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
