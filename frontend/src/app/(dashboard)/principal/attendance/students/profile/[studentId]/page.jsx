"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import { fetchStudentAttendance } from '@/services/attendanceService'
import { api } from '@/services/api'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function StudentAttendanceDetailPage() {
  const { studentId } = useParams()
  const [student, setStudent] = useState(null)
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
        const [studentRes, attendanceRes] = await Promise.all([
          api.get(`/students/${studentId}`),
          fetchStudentAttendance({ studentId, fromDate: ninetyDaysAgo, toDate: today })
        ])
        setStudent(studentRes.data.student || studentRes.data)
        setRecords(attendanceRes.records || [])
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load student details')
      } finally {
        setLoading(false)
      }
    }
    if (studentId) load()
  }, [studentId])

  // Calculate stats
  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    excused: records.filter((r) => r.status === 'excused').length,
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
        title="Student Attendance Detail"
        subtitle={student?.name || 'Unknown Student'}
        right={<ButtonLink href="/principal/attendance/students" variant="secondary">Back</ButtonLink>}
      />

      {/* STUDENT INFO */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Student Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Name</p>
            <p className="font-semibold">{student?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Roll No</p>
            <p className="font-semibold">{student?.rollNo || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Class</p>
            <p className="font-semibold">{student?.class?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Section</p>
            <p className="font-semibold">{student?.section || '-'}</p>
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

      {/* ATTENDANCE History */}
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
                  <th className="py-3 px-4 font-semibold">Class</th>
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
                    <td className="py-3 px-4">{record.class?.name || '-'}</td>
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