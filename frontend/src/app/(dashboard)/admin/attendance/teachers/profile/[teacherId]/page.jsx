"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import AttendanceHistoryTable from '@/components/attendance/AttendanceHistoryTable'
import AttendanceRateCard from '@/components/attendance/AttendanceRateCard'
import AttendanceStatsGrid from '@/components/attendance/AttendanceStatsGrid'
import { fetchStaffAttendance } from '@/services/attendanceService'
import userService from '@/services/user.service'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function StaffAttendanceDetailPage() {
  const { teacherId } = useParams()
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
          userService.getUser(teacherId),
          fetchStaffAttendance({ userId: teacherId, fromDate: ninetyDaysAgo, toDate: today })
        ])
        setStaff(staffRes?.user || staffRes)
        setRecords(attendanceRes.records || [])
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load staff details')
      } finally {
        setLoading(false)
      }
    }
    if (teacherId) load()
  }, [teacherId])

  // Calculate stats
  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    leave: records.filter((r) => r.status === 'leave').length,
    percentage: records.length > 0
      ? ((records.filter((r) => r.status === 'present').length / records.length) * 100).toFixed(1)
      : 0
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
        right={<ButtonLink href="/admin/attendance/teachers" variant="secondary">Back</ButtonLink>}
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

      {/* STATUS BREAKDOWN */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Status Breakdown</h3>
        <AttendanceStatsGrid
          columns={4}
          items={[
            {
              label: 'Present',
              value: stats.present,
              sublabel: `${stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%`,
              className: 'bg-green-50',
              valueClassName: 'text-green-700',
            },
            {
              label: 'Absent',
              value: stats.absent,
              sublabel: `${stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}%`,
              className: 'bg-red-50',
              valueClassName: 'text-red-700',
            },
            {
              label: 'Late',
              value: stats.late,
              sublabel: `${stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}%`,
              className: 'bg-amber-50',
              valueClassName: 'text-amber-700',
            },
            {
              label: 'Leave',
              value: stats.leave,
              sublabel: `${stats.total > 0 ? ((stats.leave / stats.total) * 100).toFixed(1) : 0}%`,
              className: 'bg-purple-50',
              valueClassName: 'text-purple-700',
            },
          ]}
        />
      </Card>

      {/* ATTENDANCE HISTORY */}
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
            key: 'markedBy',
            label: 'Marked By',
            render: (record) => record.markedBy?.name || '-',
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