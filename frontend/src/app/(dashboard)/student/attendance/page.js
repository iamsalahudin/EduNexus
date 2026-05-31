'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import authService from '@/services/auth.service'
import { fetchStudentAttendance, fetchStudentAttendanceSummary } from '@/services/attendanceService'
import {
  AttendanceKpiGrid,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
} from '@/components/ui'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function formatDate(d) {
  const dt = d instanceof Date ? d : new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function StudentAttendancePage() {
  const today = new Date()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  // Attendance data
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [summaryData, setSummaryData] = useState(null)
  const [fetching, setFetching] = useState(false)

  // Leave request form
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    fromDate: formatDate(today),
    toDate: formatDate(today),
    reason: '',
    mode: 'single', // 'single', 'range', 'multiple'
  })
  const [pendingLeaves, setPendingLeaves] = useState([])
  const [submittingLeave, setSubmittingLeave] = useState(false)
  const [leaveError, setLeaveError] = useState(null)

  // Load current user
  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await authService.me()
        setUser(userData)
      } catch (err) {
        setError(err.message || 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  // Load attendance data for the current month
  const loadAttendance = useCallback(async () => {
    if (!user) return
    setFetching(true)
    setError(null)
    try {
      const fromDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
      const daysInMonth = getDaysInMonth(currentYear, currentMonth)
      const toDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

      const [recordsRes, summaryRes] = await Promise.all([
        fetchStudentAttendance({ fromDate, toDate }),
        fetchStudentAttendanceSummary({ fromDate, toDate }),
      ])

      setAttendanceRecords(recordsRes.records || [])
      setSummaryData(summaryRes)
    } catch (err) {
      setError(err.message || 'Failed to load attendance')
    } finally {
      setFetching(false)
    }
  }, [currentMonth, currentYear, user])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  // Get attendance status for a specific date
  const getStatusForDate = useCallback((date) => {
    const dateStr = formatDate(date)
    const record = attendanceRecords.find((r) => formatDate(r.date) === dateStr)
    return record ? record.status : null
  }, [attendanceRecords])

  // Calculate summary stats
  const stats = useMemo(() => {
    const summary = { total: 0, present: 0, absent: 0, late: 0, leave: 0 }
    for (const record of attendanceRecords) {
      summary.total += 1
      const status = String(record?.status || '').toLowerCase()
      if (status === 'present') summary.present += 1
      else if (status === 'late') summary.late += 1
      else if (status === 'leave' || status === 'excused') summary.leave += 1
      else summary.absent += 1
    }
    return summary
  }, [attendanceRecords])

  const attendanceRate = stats.total ? ((stats.present / stats.total) * 100).toFixed(1) : '0.0'

  // Handle month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Handle leave request submission (placeholder - backend not yet implemented)
  const handleSubmitLeaveRequest = async () => {
    setLeaveError(null)
    setSubmittingLeave(true)

    // Validate form
    if (!leaveForm.reason.trim()) {
      setLeaveError('Reason is required')
      setSubmittingLeave(false)
      return
    }

    if (new Date(leaveForm.toDate) < new Date(leaveForm.fromDate)) {
      setLeaveError('End date must be after start date')
      setSubmittingLeave(false)
      return
    }

    try {
      // This endpoint will be created in backend
      // For now, add a placeholder
      const leaveRequest = {
        id: Math.random().toString(36),
        from: leaveForm.fromDate,
        to: leaveForm.toDate,
        reason: leaveForm.reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      setPendingLeaves([...pendingLeaves, leaveRequest])
      setLeaveForm({
        fromDate: formatDate(today),
        toDate: formatDate(today),
        reason: '',
        mode: 'single',
      })
      setShowLeaveForm(false)
    } catch (err) {
      setLeaveError(err.message || 'Failed to submit leave request')
    } finally {
      setSubmittingLeave(false)
    }
  }

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days = []

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dateStr = formatDate(date)
      const isToday = formatDate(today) === dateStr
      const status = getStatusForDate(date)

      let bgColor = 'bg-gray-50'
      let borderColor = 'border-gray-200'

      if (status) {
        if (status.toLowerCase() === 'present') {
          bgColor = 'bg-green-50'
          borderColor = 'border-green-200'
        } else if (status.toLowerCase() === 'absent') {
          bgColor = 'bg-red-50'
          borderColor = 'border-red-200'
        } else if (status.toLowerCase() === 'late') {
          bgColor = 'bg-amber-50'
          borderColor = 'border-amber-200'
        } else if (status.toLowerCase() === 'leave' || status.toLowerCase() === 'excused') {
          bgColor = 'bg-blue-50'
          borderColor = 'border-blue-200'
        }
      }

      days.push(
        <div
          key={day}
          className={`p-3 border rounded ${bgColor} ${borderColor} ${isToday ? 'ring-2 ring-blue-400' : ''}`}
        >
          <div className="text-sm font-semibold text-gray-900">{day}</div>
          {status && (
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          )}
        </div>
      )
    }

    return days
  }

  if (loading) return <Skeleton className="h-screen" />
  if (error && !user) return <EmptyState title="Error" description={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        subtitle="Track your attendance records and request leaves"
      />

      {/* Summary Cards */}
      <AttendanceKpiGrid
        items={[
          { label: 'Total Days', value: stats.total, tone: 'blue' },
          { label: 'Present', value: stats.present, tone: 'green', hint: `${attendanceRate}% attendance` },
          { label: 'Absent', value: stats.absent, tone: 'red' },
          { label: 'Late / Leave', value: stats.late + stats.leave, tone: 'amber' },
        ]}
      />

      {/* Month Calendar */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handlePrevMonth} className="px-3">
                ← Prev
              </Button>
              <Button variant="secondary" onClick={handleNextMonth} className="px-3">
                Next →
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2">
            {DAY_NAMES.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm border-t pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-200 border border-green-300"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-200 border border-red-300"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-200 border border-amber-300"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300"></div>
              <span>Leave/Excused</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Leave Request Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Request Leave</h3>
          <Button
            variant={showLeaveForm ? 'secondary' : 'primary'}
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            className="px-4"
          >
            {showLeaveForm ? 'Cancel' : 'Request Leave'}
          </Button>
        </div>

        {showLeaveForm && (
          <div className="space-y-4 mt-4 border-t pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium block mb-2">From Date</label>
                <Input
                  type="date"
                  value={leaveForm.fromDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">To Date</label>
                <Input
                  type="date"
                  value={leaveForm.toDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Reason</label>
              <Textarea
                placeholder="Enter the reason for your leave request..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                rows={3}
              />
            </div>

            {leaveError && <div className="text-sm text-red-600">{leaveError}</div>}

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleSubmitLeaveRequest}
                disabled={submittingLeave}
                className="flex-1"
              >
                {submittingLeave ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowLeaveForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Pending Leaves */}
      {pendingLeaves.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Pending Leave Requests</h3>
          <div className="space-y-3">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {leave.from} to {leave.to}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{leave.reason}</div>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 p-4 rounded">{error}</div>}
    </div>
  )
}

