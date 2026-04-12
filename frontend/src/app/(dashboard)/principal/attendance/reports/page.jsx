'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import {
  exportStaffAttendance,
  exportStudentAttendance,
  fetchStaffAttendance,
  fetchStudentAttendance,
  fetchStudents,
} from '@/services/attendanceService'
import { api } from '@/services/api'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

function isTeacherRole(role) {
  return /teacher/i.test(String(role || ''))
}

function isNonTeaching(role) {
  const value = String(role || '').toLowerCase()
  if (!value) return false
  if (value.includes('teacher') || value.includes('student') || value.includes('parent') || value.includes('principal')) return false
  return true
}

export default function PrincipalAttendanceReportsPage() {
  const today = toInputDate(new Date())
  const monthStart = `${today.slice(0, 8)}01`

  const [reportType, setReportType] = useState('students')
  const [fromDate, setFromDate] = useState(monthStart)
  const [toDate, setToDate] = useState(today)
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')
  const [search, setSearch] = useState('')
  const [classes, setClasses] = useState([])

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  const sections = useMemo(() => {
    const cls = classes.find((item) => String(item._id) === String(classId))
    return Array.isArray(cls?.sections) ? cls.sections : []
  }, [classes, classId])

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await classesService.listClasses({ active: true })
        setClasses(Array.isArray(res?.classes) ? res.classes : [])
      } catch (e) {
        setClasses([])
      }
    }
    loadClasses()
  }, [])

  useEffect(() => {
    if (!classId) setSection('')
  }, [classId])

  async function runReport() {
    setLoading(true)
    setError(null)

    try {
      if (reportType === 'students') {
        const [studentsRes, attendanceRes] = await Promise.all([
          fetchStudents({ classId: classId || undefined, section: section || undefined, limit: 1200 }),
          fetchStudentAttendance({ classId: classId || undefined, fromDate, toDate })
        ])

        const students = studentsRes?.students || []
        const records = attendanceRes?.records || []

        const byStudent = new Map()
        for (const rec of records) {
          const sid = String(rec?.student?._id || rec?.student || '')
          if (!sid) continue
          if (!byStudent.has(sid)) byStudent.set(sid, { total: 0, present: 0 })
          const curr = byStudent.get(sid)
          curr.total += 1
          if (String(rec.status || '').toLowerCase() === 'present') curr.present += 1
        }

        const reportRows = students
          .filter((student) => !section || String(student?.section || '') === String(section))
          .map((student) => {
            const sid = String(student._id)
            const agg = byStudent.get(sid) || { total: 0, present: 0 }
            const percentage = agg.total ? ((agg.present / agg.total) * 100).toFixed(1) : '0.0'
            return {
              id: sid,
              name: student?.name || '-',
              className: student?.class?.name || '-',
              section: student?.section || '-',
              total: agg.total,
              present: agg.present,
              percentage: Number(percentage)
            }
          })

        setRows(reportRows)
      } else {
        const [usersRes, attendanceRes] = await Promise.all([
          api.get('/users', { params: { limit: 1200 } }),
          fetchStaffAttendance({ fromDate, toDate })
        ])
        const users = usersRes?.data?.users || []
        const records = attendanceRes?.records || []

        let relevantUsers = users
        if (reportType === 'teachers') relevantUsers = users.filter((u) => isTeacherRole(u?.role))
        if (reportType === 'staff') relevantUsers = users.filter((u) => isNonTeaching(u?.role))

        const recordsByUser = new Map()
        for (const rec of records) {
          const uid = String(rec?.user?._id || rec?.user || '')
          if (!uid) continue
          if (!recordsByUser.has(uid)) recordsByUser.set(uid, { total: 0, present: 0 })
          const curr = recordsByUser.get(uid)
          curr.total += 1
          if (String(rec.status || '').toLowerCase() === 'present') curr.present += 1
        }

        const userRows = relevantUsers.map((user) => {
          const uid = String(user._id)
          const agg = recordsByUser.get(uid) || { total: 0, present: 0 }
          const percentage = agg.total ? ((agg.present / agg.total) * 100).toFixed(1) : '0.0'
          return {
            id: uid,
            name: user?.name || '-',
            role: user?.role || '-',
            department: user?.profile?.department || '-',
            total: agg.total,
            present: agg.present,
            percentage: Number(percentage)
          }
        })

        if (reportType === 'school') {
          const studentRes = await fetchStudentAttendance({ fromDate, toDate })
          const studentRecords = studentRes?.records || []
          const studentPresent = studentRecords.filter((r) => String(r.status || '').toLowerCase() === 'present').length
          const studentRate = studentRecords.length ? ((studentPresent / studentRecords.length) * 100).toFixed(1) : '0.0'

          const staffPresent = records.filter((r) => String(r.status || '').toLowerCase() === 'present').length
          const staffRate = records.length ? ((staffPresent / records.length) * 100).toFixed(1) : '0.0'

          setRows([
            { id: 'students', name: 'Students', total: studentRecords.length, present: studentPresent, percentage: Number(studentRate) },
            { id: 'staff', name: 'Staff & Teachers', total: records.length, present: staffPresent, percentage: Number(staffRate) },
          ])
        } else {
          setRows(userRows)
        }
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  async function downloadReport(format) {
    setDownloading(true)
    setError(null)
    try {
      let blob
      if (reportType === 'students') {
        blob = await exportStudentAttendance({ classId: classId || undefined, fromDate, toDate, format })
      } else {
        blob = await exportStaffAttendance({ fromDate, toDate, format })
      }
      downloadBlob(blob, `principal-attendance-${reportType}-${fromDate}-to-${toDate}.${format}`)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || `Failed to download ${format.toUpperCase()} report`)
    } finally {
      setDownloading(false)
    }
  }

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const name = String(row.name || '').toLowerCase()
      const cls = String(row.className || '').toLowerCase()
      const sec = String(row.section || '').toLowerCase()
      const dept = String(row.department || '').toLowerCase()
      return name.includes(q) || cls.includes(q) || sec.includes(q) || dept.includes(q)
    })
  }, [rows, search])

  const maxDate = toInputDate(new Date())

  return (
    <div>
      <PageHeader
        title="Attendance Reports"
        subtitle="View and download attendance reports for students, teachers, staff, and school trends."
        right={<ButtonLink href="/principal/attendance" variant="secondary">Back</ButtonLink>}
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Select label="Report" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="students">Student Reports</option>
            <option value="teachers">Teacher Reports</option>
            <option value="staff">Staff Reports</option>
            <option value="school">School Reports</option>
          </Select>
          <Input label="From" type="date" value={fromDate} max={maxDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label="To" type="date" value={toDate} max={maxDate} onChange={(e) => setToDate(e.target.value)} />
          <Select
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={reportType !== 'students'}
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </Select>
          <Select
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={reportType !== 'students' || !classId}
          >
            <option value="">All Sections</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </Select>
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user/class" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={runReport} disabled={loading}>{loading ? 'Loading...' : 'View Report'}</Button>
          <Button variant="outline" onClick={() => downloadReport('csv')} disabled={downloading}>{downloading ? 'Downloading...' : 'Download CSV'}</Button>
          <Button variant="outline" onClick={() => downloadReport('pdf')} disabled={downloading}>{downloading ? 'Downloading...' : 'Download PDF'}</Button>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Report Results ({visibleRows.length})</h3>
        <div className="overflow-auto">
          {loading ? (
            <Skeleton className="h-56" />
          ) : visibleRows.length === 0 ? (
            <p className="text-sm text-gray-600">No report data found. Adjust filters and click View Report.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  {reportType === 'students' ? <th className="py-3 px-4 font-semibold">Class</th> : null}
                  {reportType === 'students' ? <th className="py-3 px-4 font-semibold">Section</th> : null}
                  {(reportType === 'teachers' || reportType === 'staff') ? <th className="py-3 px-4 font-semibold">Department</th> : null}
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Present</th>
                  <th className="py-3 px-4 font-semibold">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">
                      {reportType === 'students' ? (
                        <ButtonLink href={`/principal/attendance/students/${row.id}`} variant="outline" size="sm">
                          {row.name}
                        </ButtonLink>
                      ) : reportType === 'teachers' ? (
                        <ButtonLink href={`/principal/attendance/teachers/${row.id}`} variant="outline" size="sm">
                          {row.name}
                        </ButtonLink>
                      ) : reportType === 'staff' ? (
                        <ButtonLink href={`/principal/attendance/staff/${row.id}`} variant="outline" size="sm">
                          {row.name}
                        </ButtonLink>
                      ) : (
                        row.name
                      )}
                    </td>
                    {reportType === 'students' ? <td className="py-3 px-4">{row.className || '-'}</td> : null}
                    {reportType === 'students' ? <td className="py-3 px-4">{row.section || '-'}</td> : null}
                    {(reportType === 'teachers' || reportType === 'staff') ? <td className="py-3 px-4">{row.department || '-'}</td> : null}
                    <td className="py-3 px-4">{row.total}</td>
                    <td className="py-3 px-4 text-green-700 font-semibold">{row.present}</td>
                    <td className="py-3 px-4 font-semibold">{Number(row.percentage || 0).toFixed(1)}%</td>
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
