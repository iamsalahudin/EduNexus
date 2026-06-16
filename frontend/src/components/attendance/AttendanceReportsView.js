"use client"

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton, Table, TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui'
import { fetchAttendanceReport } from '@/services/attendanceService'
import classesService from '@/services/classesService'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const DEFAULT_REPORT_TYPES = [
  { value: 'class-wise', label: 'Class-wise Report' },
  { value: 'student-wise', label: 'Student-wise Report' },
  { value: 'teacher-search', label: 'Teacher Attendance' },
  { value: 'school-trends', label: 'School Trends' },
]

export default function AttendanceReportsView({
  title,
  subtitle,
  backHref = '/admin/attendance',
  reportTypes = DEFAULT_REPORT_TYPES,
}) {
  const today = toInputDate(new Date())
  const thirtyDaysAgo = toInputDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

  const [reportType, setReportType] = useState(reportTypes?.[0]?.value || 'class-wise')
  const [fromDate, setFromDate] = useState(thirtyDaysAgo)
  const [toDate, setToDate] = useState(today)
  const [classId, setClassId] = useState('')
  const [classes, setClasses] = useState([])

  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await classesService.listClasses({ active: true })
        setClasses(Array.isArray(res?.classes) ? res.classes : [])
      } catch (e) {
        // Keep dropdown empty on failure
      }
    }
    loadClasses()
  }, [])

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
          toDate,
        })
        setReportData(Array.isArray(reportRes?.report) ? reportRes.report : [])
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to generate report')
      } finally {
        setLoading(false)
      }
    }

    if (reportType === 'student-wise' && !classId) return
    autoGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, fromDate, toDate, classId])

  async function generateReport() {
    setLoading(true)
    setError(null)
    setReportData(null)

    try {
      const reportRes = await fetchAttendanceReport({
        reportType,
        classId: reportType === 'student-wise' ? classId : '',
        fromDate,
        toDate,
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
        title={title}
        subtitle={subtitle}
        right={(
          <ButtonLink href={backHref} variant="secondary">
            Back
          </ButtonLink>
        )}
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            {reportTypes.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
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
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
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

          <Table>
            <TableRoot className="min-w-full text-sm">
              <TableHead>
                <TableRow className="text-left border-b bg-gray-50">
                  <TableHeader>
                    {reportType === 'class-wise'
                      ? 'Class'
                      : reportType === 'student-wise'
                        ? 'Student'
                        : reportType === 'teacher-search'
                          ? 'Teacher'
                          : 'Date'}
                  </TableHeader>
                  <TableHeader className="text-center">Total</TableHeader>
                  <TableHeader className="text-center">Present</TableHeader>
                  <TableHeader className="text-center">Absent</TableHeader>
                  {reportType === 'school-trends' && (
                    <TableHeader className="text-center">Late</TableHeader>
                  )}
                  <TableHeader className="text-center">Rate %</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map((row, idx) => {
                  const key = reportType === 'class-wise'
                    ? row.class
                    : reportType === 'school-trends'
                      ? row.date
                      : row.name
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell className="text-center">{row.total}</TableCell>
                      <TableCell className="text-center text-green-600 font-semibold">{row.present}</TableCell>
                      <TableCell className="text-center text-red-600 font-semibold">{row.absent}</TableCell>
                      {reportType === 'school-trends' && (
                        <TableCell className="text-center text-amber-600 font-semibold">{row.late}</TableCell>
                      )}
                      <TableCell className="text-center font-semibold">{row.percentage}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </TableRoot>
          </Table>
        </Card>
      ) : (
        <Card className="mt-6 bg-blue-50 border border-blue-200">
          <p className="text-center text-blue-600 text-sm">
            Configure filters and generate a report to see results.
          </p>
        </Card>
      )}
    </div>
  )
}
