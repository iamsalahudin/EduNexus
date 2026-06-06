'use client'

import { useEffect, useMemo, useState } from 'react'
import { AttendanceKpiGrid, AttendancePeriodSelector, Button, Card, Skeleton, Input, Select, Textarea, Table, TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui'
import StatusBadge from '@/components/ui/StatusBadge'
import { fetchStudentAttendance, exportStudentAttendance, submitLeaveRequest, fetchLeaveRequests, editLeaveRequest } from '@/services/attendanceService'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function currentMonthValue(date = new Date()) {
  return String(date.getMonth() + 1).padStart(2, '0')
}

function getRange({ mode, month, year, fromDate, toDate }) {
  const now = new Date()
  const resolvedYear = Number(year) || now.getFullYear()

  if (mode === 'year') {
    return { fromDate: `${resolvedYear}-01-01`, toDate: `${resolvedYear}-12-31` }
  }

  if (mode === 'custom') {
    return { fromDate, toDate }
  }

  const resolvedMonth = String(month || currentMonthValue(now)).padStart(2, '0')
  return {
    fromDate: `${resolvedYear}-${resolvedMonth}-01`,
    toDate: toInputDate(new Date(resolvedYear, Number(resolvedMonth), 0))
  }
}

function summarize(records = []) {
  const summary = { total: 0, present: 0, absent: 0, late: 0, leave: 0 }
  for (const record of records) {
    summary.total += 1
    const status = String(record?.status || '').toLowerCase()
    if (status === 'present') summary.present += 1
    else if (status === 'late') summary.late += 1
    else if (status === 'leave' || status === 'excused') summary.leave += 1
    else summary.absent += 1
  }
  return summary
}

export default function StudentAttendanceRecordsView({
  title = 'Student Attendance',
  description = 'View attendance records by class/date range.',
  showClassFilter = true,
  studentId = '',
} = {}) {
  const today = new Date()
  const [classId, setClassId] = useState('')
  const [mode, setMode] = useState('month')
  const [month, setMonth] = useState(currentMonthValue(today))
  const [year, setYear] = useState(String(today.getFullYear()))
  const [fromDate, setFromDate] = useState(toInputDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14)))
  const [toDate, setToDate] = useState(toInputDate(today))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [records, setRecords] = useState([])
  const [exporting, setExporting] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [leaveError, setLeaveError] = useState(null)
  const [leaveRequests, setLeaveRequests] = useState([])

  // leave form
  const [leaveFrom, setLeaveFrom] = useState(toInputDate(today))
  const [leaveTo, setLeaveTo] = useState(toInputDate(today))
  const [leaveType, setLeaveType] = useState('full-day')
  const [leaveReason, setLeaveReason] = useState('')
  const [activeRange, setActiveRange] = useState({ fromDate: '', toDate: '' })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const range = getRange({ mode, month, year, fromDate, toDate })
      setActiveRange(range)
      const res = await fetchStudentAttendance({
        studentId: studentId || undefined,
        classId: classId || undefined,
        fromDate: range.fromDate,
        toDate: range.toDate,
      })
      setRecords(res.records || [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    setError(null)
    try {
      const range = getRange({ mode, month, year, fromDate, toDate })
      const blob = await exportStudentAttendance({
        classId: classId || undefined,
        studentId: studentId || undefined,
        fromDate: range.fromDate,
        toDate: range.toDate,
        format: 'csv',
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `student_attendance_${range.fromDate}_to_${range.toDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to export')
    } finally {
      setExporting(false)
    }
  }

  async function loadLeaveRequests() {
    setLeaveLoading(true)
    setLeaveError(null)
    try {
      const res = await fetchLeaveRequests({ studentId: studentId || undefined })
      setLeaveRequests(res.requests || [])
    } catch (e) {
      setLeaveError(e?.response?.data?.error || e.message || 'Failed to load leave requests')
    } finally {
      setLeaveLoading(false)
    }
  }

  async function handleSubmitLeave(e) {
    e.preventDefault()
    setLeaveError(null)
    try {
      await submitLeaveRequest({ fromDate: leaveFrom, toDate: leaveTo, type: leaveType, reason: leaveReason })
      setLeaveReason('')
      await load()
      await loadLeaveRequests()
    } catch (err) {
      setLeaveError(err?.response?.data?.error || err.message || 'Failed to submit')
    }
  }

  async function handleCancelLeave(id) {
    try {
      await editLeaveRequest(id, { status: 'cancelled' })
      await loadLeaveRequests()
      await load()
    } catch (err) {
      setLeaveError(err?.response?.data?.error || err.message || 'Failed to cancel')
    }
  }

  useEffect(() => {
    load()
    loadLeaveRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, studentId, mode, month, year, fromDate, toDate])

  const stats = useMemo(() => summarize(records), [records])
  const attendanceRate = stats.total ? ((stats.present / stats.total) * 100).toFixed(1) : '0.0'

  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-gray-600 mt-1">{description}</p>

      <div className="mt-6 space-y-4">
        <AttendancePeriodSelector
          mode={mode}
          onModeChange={setMode}
          month={month}
          onMonthChange={setMonth}
          year={year}
          onYearChange={setYear}
          fromDate={fromDate}
          onFromDateChange={setFromDate}
          toDate={toDate}
          onToDateChange={setToDate}
        />

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Filters</div>
              <div className="text-xs text-gray-500">
                {activeRange.fromDate && activeRange.toDate ? `${activeRange.fromDate} to ${activeRange.toDate}` : 'Range not set yet'}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>
              <Button variant="primary" onClick={handleExport} disabled={exporting || loading}>Export CSV</Button>
            </div>
          </div>

          {showClassFilter ? (
            <div className="mt-4 max-w-xs">
              <label className="text-sm font-medium">Class (optional)</label>
              <input className="input mt-2" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g. 10" />
            </div>
          ) : null}
        </Card>

        <AttendanceKpiGrid
          items={[
            { label: 'Total Days', value: stats.total, tone: 'blue', hint: `${mode === 'month' ? 'Monthly' : mode === 'year' ? 'Yearly' : 'Custom'} range` },
            { label: 'Present', value: stats.present, tone: 'green', hint: `${attendanceRate}% attendance rate` },
            { label: 'Absent', value: stats.absent, tone: 'red', hint: 'Not present' },
            { label: 'Late / Leave', value: stats.late + stats.leave, tone: 'amber', hint: 'Late + excused days' },
          ]}
        />

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <Card>
          <h3 className="font-medium">Leave Request</h3>
          <form className="mt-3 space-y-3" onSubmit={handleSubmitLeave}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">From</label>
                <Input type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">To</label>
                <Input type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="mt-2">
                <option value="full-day">Full day</option>
                <option value="half-day">Half day</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className="mt-2" />
            </div>
            {leaveError ? <div className="text-sm text-red-600">{leaveError}</div> : null}
            <div className="flex gap-2">
              <Button type="submit" variant="primary">Submit Request</Button>
              <Button type="button" variant="secondary" onClick={() => { setLeaveReason(''); setLeaveFrom(toInputDate(today)); setLeaveTo(toInputDate(today)); }}>Reset</Button>
            </div>
          </form>
        </Card>

        <Card>
          <h3 className="font-medium">My Leave Requests</h3>
          <div className="mt-3">
            {leaveLoading ? <Skeleton className="h-24" /> : leaveRequests.length === 0 ? <div className="text-sm text-gray-600">No leave requests.</div> : (
              <Table>
                <TableRoot className="min-w-full text-sm">
                  <TableHead>
                    <TableRow className="text-left border-b">
                      <TableHeader>From</TableHeader>
                      <TableHeader>To</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveRequests.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>{String(r.fromDate || '').slice(0, 10)}</TableCell>
                        <TableCell>{String(r.toDate || '').slice(0, 10)}</TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                        <TableCell>
                          {r.status === 'pending' ? <Button variant="secondary" onClick={() => handleCancelLeave(r._id)}>Cancel</Button> : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableRoot>
              </Table>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-medium">Records</h3>
          <div className="mt-3 overflow-auto">
            {loading && records.length === 0 ? (
              <Skeleton className="h-40" />
            ) : records.length === 0 ? (
              <div className="text-sm text-gray-600">No records found.</div>
            ) : (
              <Table>
                <TableRoot className="min-w-full text-sm">
                  <TableHead>
                    <TableRow className="text-left border-b">
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Student</TableHeader>
                      <TableHeader>Class</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Marked By</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>{String(r.date).slice(0, 10)}</TableCell>
                        <TableCell>{r.student?.firstName} {r.student?.lastName}</TableCell>
                        <TableCell>{r.class}{r.section ? `-${r.section}` : ''}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                        <TableCell>{r.teacher?.name || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableRoot>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

