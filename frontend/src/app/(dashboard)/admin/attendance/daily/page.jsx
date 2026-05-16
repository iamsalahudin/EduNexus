"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import { fetchStudents, fetchStudentAttendance, updateStudentAttendance } from '@/services/attendanceService'
import classesService from '@/services/classesService'
import { ATTENDANCE_STATUS_OPTIONS } from '@/utils/constants'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function DailyStudentAttendancePage() {
  const today = toInputDate(new Date())
  const [date, setDate] = useState(today)
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')

  const [students, setStudents] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)

  // Get sections for selected class
  const classSections = useMemo(() => {
    if (!classId) return []
    const selectedClass = classes.find((c) => String(c._id) === String(classId))
    return Array.isArray(selectedClass?.sections) ? selectedClass.sections : []
  }, [classes, classId])

  // Load classes on mount
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

  // Load students and attendance when class/date changes
  useEffect(() => {
    if (!classId) {
      setStudents([])
      setRecords([])
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, section, date])

  // Reset section when class changes
  useEffect(() => {
    if (classId && section && !classSections.includes(section)) {
      setSection('')
    }
  }, [classId, classSections, section])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        fetchStudents({ classId, section: section || undefined, limit: 500 }),
        fetchStudentAttendance({ classId, date })
      ])
      const studentList = studentsRes.students || []
      const recordList = attendanceRes.records || []

      // Map records by student ID
      const recordByStudentId = new Map()
      for (const r of recordList) {
        const sid = r?.student?._id || r?.student
        if (sid) recordByStudentId.set(String(sid), r)
      }

      // Merge students with attendance records
      const merged = studentList.map((s) => ({
        ...s,
        attendance: recordByStudentId.get(String(s._id))
      }))

      setStudents(merged)
      setRecords(recordList)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  // Handle status change
  async function handleStatusChange(studentId, recordId, newStatus) {
    if (!recordId) {
      setError('Cannot update: Record ID missing')
      return
    }
    setUpdating(true)
    setError(null)
    try {
      await updateStudentAttendance(recordId, { status: newStatus })
      // Update local state
      setStudents((prev) =>
        prev.map((s) =>
          s._id === studentId ? { ...s, attendance: { ...s.attendance, status: newStatus } } : s
        )
      )
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to update attendance')
    } finally {
      setUpdating(false)
    }
  }

  // Calculate summary
  const summary = useMemo(() => {
    const total = students.length
    const present = students.filter((s) => s.attendance?.status === 'present').length
    const absent = students.filter((s) => s.attendance?.status === 'absent').length
    const late = students.filter((s) => s.attendance?.status === 'late').length
    const excused = students.filter((s) => s.attendance?.status === 'excused').length
    return { total, present, absent, late, excused }
  }, [students])

  // Date validation: disable future dates
  const maxDate = toInputDate(new Date())

  return (
    <div>
      <PageHeader
        title="Daily Student Attendance"
        subtitle="View and manage student attendance for a specific date by class and section."
        right={<ButtonLink href="/admin/attendance" variant="secondary">Back</ButtonLink>}
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      {/* FILTERS */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={maxDate}
          />
          <Select
            label="Class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              setSection('')
            }}
            options={[
              { value: '', label: 'Select Class' },
              ...classes.map((c) => ({ value: c._id, label: c.name }))
            ]}
          />
          <Select
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={!classId}
            options={[
              { value: '', label: 'All Sections' },
              ...classSections.map((sec) => ({ value: sec, label: sec }))
            ]}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* SUMMARY CARDS */}
      {classId && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-blue-50 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Total Students</div>
            <div className="mt-2 text-2xl font-bold text-blue-700">{summary.total}</div>
          </Card>
          <Card className="bg-green-50 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Present</div>
            <div className="mt-2 text-2xl font-bold text-green-700">{summary.present}</div>
          </Card>
          <Card className="bg-red-50 border border-red-200">
            <div className="text-sm text-red-600 font-medium">Absent</div>
            <div className="mt-2 text-2xl font-bold text-red-700">{summary.absent}</div>
          </Card>
          <Card className="bg-amber-50 border border-amber-200">
            <div className="text-sm text-amber-600 font-medium">Late</div>
            <div className="mt-2 text-2xl font-bold text-amber-700">{summary.late}</div>
          </Card>
          <Card className="bg-purple-50 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">Excused</div>
            <div className="mt-2 text-2xl font-bold text-purple-700">{summary.excused}</div>
          </Card>
        </div>
      )}

      {/* ATTENDANCE TABLE */}
      {classId && (
        <Card className="mt-6">
          <h3 className="font-semibold mb-4">Attendance Records</h3>
          <div className="overflow-auto">
            {loading && students.length === 0 ? (
              <Skeleton className="h-64" />
            ) : students.length === 0 ? (
              <div className="text-sm text-gray-600 py-4">No students found for selected class and section.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Class</th>
                    <th className="py-3 px-4 font-semibold">Section</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const attendanceStatus = student.attendance?.status || 'present'
                    const recordId = student.attendance?._id
                    return (
                      <tr key={student._id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-4">{student.name || '-'}</td>
                        <td className="py-3 px-4">{student.class?.name || '-'}</td>
                        <td className="py-3 px-4">{student.section || '-'}</td>
                        <td className="py-3 px-4">
                          <Select
                            value={attendanceStatus}
                            onChange={(e) => handleStatusChange(student._id, recordId, e.target.value)}
                            disabled={updating}
                            options={STATUSES}
                            className={`py-1 px-2 text-sm rounded ${
                              attendanceStatus === 'present' ? 'bg-green-100 text-green-700' :
                              attendanceStatus === 'absent' ? 'bg-red-100 text-red-700' :
                              attendanceStatus === 'late' ? 'bg-amber-100 text-amber-700' :
                              'bg-purple-100 text-purple-700'
                            }`}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {!classId && (
        <Card className="mt-6 bg-blue-50 border border-blue-200">
          <div className="text-center text-blue-700">
            <p className="text-sm">Select a class above to view and manage attendance for {date || 'the selected date'}.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
