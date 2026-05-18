"use client"

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import { fetchAttendanceReport } from '@/services/attendanceService'
import classesService from '@/services/classesService'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function AttendanceReportsPage() {
  const today = toInputDate(new Date())
  const thirtyDaysAgo = toInputDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

  const [reportType, setReportType] = useState('class-wise')
  const [fromDate, setFromDate] = useState(thirtyDaysAgo)
  const [toDate, setToDate] = useState(today)
  const [classId, setClassId] = useState('')
  const [classes, setClasses] = useState([])

  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await classesService.listClasses({ active: true })
        setClasses(Array.isArray(res?.classes) ? res.classes : [])
      } catch (e) {
        console.error('Failed to load classes:', e)
      }
    }
    loadClasses()
  }, [])

  // Auto-generate report when filters change
  useEffect(() => {
    if (!reportType) return
    const autoGenerate = async () => {
      setLoading(true)
      setError(null)
      setReportData(null)
      try {
        const reportRes = await fetchAttendanceReport({
          reportType,
          classId: reportType === 'student-wise' ? classId : '',
          fromDate,
          toDate
        })
        setReportData(Array.isArray(reportRes?.report) ? reportRes.report : [])
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to generate report')
      } finally {
        setLoading(false)
      }
    }
    // Only auto-generate if classId is set for student-wise or no classId required
    if (reportType === 'student-wise' && !classId) return
    autoGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, fromDate, toDate, classId])

  // Generate report
  async function generateReport() {
    setLoading(true)
    setError(null)
    setReportData(null)

    try {
      const reportRes = await fetchAttendanceReport({
        reportType,
        classId: reportType === 'student-wise' ? classId : '',
        fromDate,
        toDate
      })

      setReportData(Array.isArray(reportRes?.report) ? reportRes.report : [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const maxDate = toInputDate(new Date())

  return (
    <div>
      <PageHeader
        title="Student Attendance Reports"
        subtitle="Generate comprehensive attendance reports with various filters and analysis."
        right={<ButtonLink href="/principal/attendance" variant="secondary">Back</ButtonLink>}
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      {/* REPORT FILTERS */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="class-wise">Class-wise Report</option>
            <option value="student-wise">Student-wise Report</option>
            <option value="teacher-search">Teacher Attendance</option>
            <option value="school-trends">School Trends</option>
          </Select>
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={maxDate}
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            max={maxDate}
          />
          {reportType === 'student-wise' && (
            <Select
              label="Class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          )}
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={generateReport}
              disabled={loading || (reportType === 'student-wise' && !classId)}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </Card>

      {/* REPORT DATA */}
      {loading ? (
        <div className="mt-6">
          <Skeleton className="h-64" />
        </div>
      ) : reportData ? (
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Report Results</h3>
            <p className="text-sm text-gray-500">
              {fromDate} to {toDate}
            </p>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-3 px-4 font-semibold">
                    {reportType === 'class-wise' ? 'Class' : reportType === 'student-wise' ? 'Student' : reportType === 'teacher-search' ? 'Teacher' : 'Date'}
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">Total</th>
                  <th className="py-3 px-4 font-semibold text-center">Present</th>
                  <th className="py-3 px-4 font-semibold text-center">Absent</th>
                  {reportType === 'school-trends' && <th className="py-3 px-4 font-semibold text-center">Late</th>}
                  <th className="py-3 px-4 font-semibold text-center">Rate %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => {
                  const key = reportType === 'class-wise' ? row.class : reportType === 'school-trends' ? row.date : row.name
                  return (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{key}</td>
                      <td className="py-3 px-4 text-center">{row.total}</td>
                      <td className="py-3 px-4 text-center text-green-600 font-semibold">{row.present}</td>
                      <td className="py-3 px-4 text-center text-red-600 font-semibold">{row.absent}</td>
                      {reportType === 'school-trends' && <td className="py-3 px-4 text-center text-amber-600 font-semibold">{row.late}</td>}
                      <td className="py-3 px-4 text-center font-semibold">{row.percentage}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 bg-blue-50 border border-blue-200">
          <p className="text-center text-blue-600 text-sm">Configure filters and generate a report to see results.</p>
        </Card>
      )}
    </div>
  )
}
