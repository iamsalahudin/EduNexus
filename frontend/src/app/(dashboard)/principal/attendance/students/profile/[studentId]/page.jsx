"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import AttendanceHistoryTable from '@/components/attendance/AttendanceHistoryTable'
import AttendanceRateCard from '@/components/attendance/AttendanceRateCard'
import AttendanceStatsGrid from '@/components/attendance/AttendanceStatsGrid'
import { fetchStudentAttendance } from '@/services/attendanceService'
import studentsService from '@/services/studentsService'

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
          studentsService.getStudentById(studentId),
          fetchStudentAttendance({ studentId, fromDate: ninetyDaysAgo, toDate: today })
        ])
        setStudent(studentRes?.student || studentRes)
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
      <AttendanceStatsGrid
        columns={5}
        className="mt-6"
        items={[
          {
            label: 'Total Days',
            value: stats.total,
            className: 'bg-blue-50 border border-blue-200',
            labelClassName: 'text-blue-600 font-medium',
            valueClassName: 'text-blue-700',
          },
          {
            label: 'Present',
            value: stats.present,
            className: 'bg-green-50 border border-green-200',
            labelClassName: 'text-green-600 font-medium',
            valueClassName: 'text-green-700',
          },
          {
            label: 'Absent',
            value: stats.absent,
            className: 'bg-red-50 border border-red-200',
            labelClassName: 'text-red-600 font-medium',
            valueClassName: 'text-red-700',
          },
          {
            label: 'Late',
            value: stats.late,
            className: 'bg-amber-50 border border-amber-200',
            labelClassName: 'text-amber-600 font-medium',
            valueClassName: 'text-amber-700',
          },
          {
            label: 'Attendance %',
            value: `${stats.percentage}%`,
            className: 'bg-purple-50 border border-purple-200',
            labelClassName: 'text-purple-600 font-medium',
            valueClassName: 'text-purple-700',
          },
        ]}
      />

      {/* ATTENDANCE RATE PROGRESS */}
      <AttendanceRateCard
        percentage={stats.percentage}
        summary={`${stats.present} present out of ${stats.total} days in last 90 days`}
      />

      {/* ATTENDANCE History */}
      <AttendanceHistoryTable
        title="Attendance History (Last 90 Days)"
        rows={records}
        columns={[
          {
            key: 'date',
            label: 'Date',
            render: (record) => String(record.date).slice(0, 10),
          },
          {
            key: 'status',
            label: 'Status',
            type: 'status',
          },
          {
            key: 'class',
            label: 'Class',
            render: (record) => record.class?.name || '-',
          },
          {
            key: 'remarks',
            label: 'Remarks',
            render: (record) => record.remarks || '-',
          },
        ]}
      />
    </div>
  )
}