"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import { fetchStaffAttendance } from '@/services/attendanceService'
import { api } from '@/services/api'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function StaffAttendanceDetailPage() {
  const { staffId } = useParams()
  const [staff, setStaff] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const today = toInputDate(new Date())
  const ninetyDaysAgo = toInputDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [staffRes, attendanceRes] = await Promise.all([
          api.get(`/users/${staffId}`),
          fetchStaffAttendance({ userId: staffId, fromDate: ninetyDaysAgo, toDate: today })
        ])
        setStaff(staffRes.data.user || staffRes.data)
        setRecords(attendanceRes.records || [])
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load staff details')
      } finally {
        setLoading(false)
      }
    }
    if (staffId) load()
  }, [staffId])

  // Calculate stats
  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    leave: records.filter((r) => r.status === 'leave').length,
    percentage: records.length > 0 ? ((records.filter((r) => r.status === 'present').length / records.length) * 100).toFixed(1) : 0
  }

  if (loading)
    return (
      <div>
        <PageHeader title="Loading..." />
        <Skeleton className="mt-6 h-64" />
      </div>
    )

  if (error)
    return (
      <div>
        <PageHeader title="Error" />
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      </div>
    )

  return (
    <div>
      <PageHeader
        title="Staff Attendance Detail"
        subtitle={staff?.name || 'Unknown Staff'}
        right={<ButtonLink href="/principal/attendance/teachers" variant="secondary">Back</ButtonLink>}
      />

      {/* STAFF INFO */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Staff Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Name</p>
            <p className="font-semibold">{staff?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Role</p>
            <p className="font-semibold">{staff?.role || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Email</p>
            <p className="font-semibold text-sm">{staff?.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Department</p>
            <p className="font-semibold">{staff?.profile?.department || '-'}</p>
          </div>
        </div>
      </Card>

      {/* ATTENDANCE STATISTICS */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Total Days</div>
          <div className="mt-2 text-2xl font-bold text-blue-700">{stats.total}</div>
        </Card>
        <Card className="bg-green-50 border border-green-200">
          <div className="text-sm text-green-600 font-medium">Present</div>
          <div className="mt-2 text-2xl font-bold text-green-700">{stats.present}</div>
        </Card>
        <Card className="bg-red-50 border border-red-200">
          <div className="text-sm text-red-600 font-medium">Absent</div>
          <div className="mt-2 text-2xl font-bold text-red-700">{stats.absent}</div>
        </Card>
        <Card className="bg-amber-50 border border-amber-200">
          <div className="text-sm text-amber-600 font-medium">Late</div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{stats.late}</div>
        </Card>
        <Card className="bg-purple-50 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Attendance %</div>
          <div className="mt-2 text-2xl font-bold text-purple-700">{stats.percentage}%</div>
        </Card>
      </div>

      {/* ATTENDANCE RATE PROGRESS */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Attendance Rate</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <span className="text-lg font-bold text-blue-600">{stats.percentage}%</span>
            </div>
            <p className="text-xs text-gray-500">
              {stats.present} present out of {stats.total} days in last 90 days
            </p>
          </div>
        </div>
      </Card>

      {/* STATUS BREAKDOWN */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded">
            <div className="text-sm text-gray-600">Present</div>
            <div className="mt-1 text-xl font-bold text-green-700">{stats.present}</div>
            <div className="mt-1 text-xs text-gray-500">
              {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded">
            <div className="text-sm text-gray-600">Absent</div>
            <div className="mt-1 text-xl font-bold text-red-700">{stats.absent}</div>
            <div className="mt-1 text-xs text-gray-500">
              {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-amber-50 p-4 rounded">
            <div className="text-sm text-gray-600">Late</div>
            <div className="mt-1 text-xl font-bold text-amber-700">{stats.late}</div>
            <div className="mt-1 text-xs text-gray-500">
              {stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-sm text-gray-600">Leave</div>
            <div className="mt-1 text-xl font-bold text-purple-700">{stats.leave}</div>
            <div className="mt-1 text-xs text-gray-500">
              {stats.total > 0 ? ((stats.leave / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </Card>

      {/* ATTENDANCE HISTORY */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Attendance History (Last 90 Days)</h3>
        <div className="overflow-auto">
          {records.length === 0 ? (
            <p className="text-sm text-gray-600 py-4">No attendance records found.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Marked By</th>
                  <th className="py-3 px-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4">{String(record.date).slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'absent'
                            ? 'bg-red-100 text-red-700'
                            : record.status === 'late'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{record.markedBy?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{record.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}