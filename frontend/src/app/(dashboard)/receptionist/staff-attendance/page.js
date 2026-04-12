'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, PageHeader, Card, StatCard, Skeleton, EmptyState } from '@/components/ui'
import staffAttendanceService from '@/services/staff-attendance.service'

const PAGE_SIZE = 10

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, halfday: 0 })
  const [records, setRecords] = useState([])
  const [q, setQ] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasPrev: false, hasNext: false })

  const stats = useMemo(() => ({
    total: summary?.total || 0,
    present: summary?.present || 0,
    absent: summary?.absent || 0,
    late: summary?.late || 0,
    halfday: summary?.halfday || 0,
  }), [summary])

  async function loadDashboard(nextPage = 1) {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, listRes] = await Promise.all([
        staffAttendanceService.getSummary({ date }),
        staffAttendanceService.listRecords({
          q: q || undefined,
          date,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          page: nextPage,
          limit: PAGE_SIZE,
        }),
      ])

      setSummary(summaryRes?.summary || {})
      setRecords(Array.isArray(listRes?.records) ? listRes.records : [])
      setPagination(listRes?.pagination || {
        page: nextPage,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      })
      setPage(listRes?.pagination?.page || nextPage)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function applyFilters() {
    await loadDashboard(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Attendance"
        subtitle="View staff punch records and attendance status."
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={loading ? '...' : stats.total} />
        <StatCard label="Present" value={loading ? '...' : stats.present} />
        <StatCard label="Absent" value={loading ? '...' : stats.absent} />
        <StatCard label="Late" value={loading ? '...' : stats.late} />
        <StatCard label="Half Day" value={loading ? '...' : stats.halfday} />
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card>
        <div>
          <h2 className="font-medium">Attendance Records</h2>
          <p className="text-sm text-gray-600 mt-1">View staff punch records</p>
        </div>

        <div className="mt-4 flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border rounded" />
          <Input placeholder="Search by name or ID" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
          <button onClick={applyFilters} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark" disabled={loading}>
            {loading ? 'Loading...' : 'Filter'}
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-40" />
          ) : records.length === 0 ? (
            <EmptyState title="No records found" />
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="py-2 px-3">Staff Name</th>
                    <th className="py-2 px-3">Staff ID</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Punch In</th>
                    <th className="py-2 px-3">Punch Out</th>
                    <th className="py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={row._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{row?.staff?.name || '-'}</td>
                      <td className="py-2 px-3">{row?.staff?.staffId || '-'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${row.status === 'present' ? 'bg-green-100 text-green-800' : row.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">{row.punchIn ? new Date(row.punchIn).toLocaleTimeString() : '-'}</td>
                      <td className="py-2 px-3">{row.punchOut ? new Date(row.punchOut).toLocaleTimeString() : '-'}</td>
                      <td className="py-2 px-3">{row.date ? new Date(row.date).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
