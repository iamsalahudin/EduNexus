'use client'

import { useEffect, useMemo, useState } from 'react'
import { AttendanceKpiGrid, AttendancePeriodSelector, Button, Card, Skeleton } from '@/components/ui'
import { fetchStudentAttendance, exportStudentAttendance } from '@/services/attendanceService'

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

  useEffect(() => {
    load()
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
        </Card>
      </div>
    </div>
  )
}

