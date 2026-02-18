"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Skeleton from '@/components/ui/Skeleton'
import { fetchStaffAttendance, fetchStaffAttendanceSummary } from '@/services/attendanceService'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function AdminStaffAttendancePage() {
  const today = new Date()
  const [fromDate, setFromDate] = useState(toInputDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14)))
  const [toDate, setToDate] = useState(toInputDate(today))

  const [summary, setSummary] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [s1, s2] = await Promise.all([
        fetchStaffAttendanceSummary({ fromDate, toDate }),
        fetchStaffAttendance({ fromDate, toDate })
      ])
      setSummary(s1.summary || null)
      setRecords(s2.records || [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Staff Attendance</h1>
          <p className="text-sm text-gray-600 mt-1">Overview of staff/teacher attendance records.</p>
        </div>
        <Link href="/admin/attendance" className="px-3 py-2 border rounded hover-theme-primary">Back</Link>
      </div>

      <div className="mt-6 card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">Total<br/>{loading ? '...' : (summary?.total ?? 0)}</div>
        <div className="card">Present<br/>{loading ? '...' : (summary?.present ?? 0)}</div>
        <div className="card">Absent<br/>{loading ? '...' : (summary?.absent ?? 0)}</div>
        <div className="card">Late/Leave<br/>{loading ? '...' : ((summary?.late ?? 0) + (summary?.leave ?? 0))}</div>
      </div>

      <div className="mt-6 card">
        <h3 className="font-medium">Records</h3>
        <div className="mt-3 overflow-auto">
          {loading && records.length === 0 ? (
            <Skeleton className="h-40" />
          ) : records.length === 0 ? (
            <div className="text-sm text-gray-600">No records for selected range.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3">{String(r.date).slice(0, 10)}</td>
                    <td className="py-2 pr-3">{r.user?.name || '-'}</td>
                    <td className="py-2 pr-3">{r.user?.role || '-'}</td>
                    <td className="py-2 pr-3">{r.status}</td>
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
