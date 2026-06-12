'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import timetableService from '@/services/timetableService'
import { fetchStudents, fetchStudentAttendance, markStudentAttendance } from '@/services/attendanceService'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import { ATTENDANCE_STATUS_OPTIONS } from '@/utils/constants'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function extractScopeFromProfile(user) {
  const profile = user?.profile || {}
  const classValue = String(profile?.class || profile?.classId || profile?.assignedClass || '').trim()
  const sectionValue = String(profile?.section || profile?.assignedSection || '').trim()
  return {
    classId: classValue,
    section: sectionValue,
  }
}

function extractScopeFromTimetable(timetable) {
  const slots = Array.isArray(timetable?.slots) ? timetable.slots : []
  const first = slots.find((slot) => String(slot?.class || '').trim())
  return {
    classId: String(first?.class || '').trim(),
    section: String(first?.section || '').trim(),
  }
}

export default function MarkAttendancePage() {
  const { user } = useAuth()
  const [scope, setScope] = useState({ classId: '', section: '' })
  const [date, setDate] = useState(toInputDate(new Date()))
  const [loadingScope, setLoadingScope] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rows, setRows] = useState([])

  useEffect(() => {
    let mounted = true

    async function resolveScope() {
      setLoadingScope(true)
      setError('')
      try {
        const profileScope = extractScopeFromProfile(user)
        if (profileScope.classId) {
          if (!mounted) return
          setScope(profileScope)
          return
        }

        const res = await timetableService.listTeacherPersonalTimetables({ isActive: true, status: 'active' })
        const firstTimetable = Array.isArray(res?.timetables) ? res.timetables[0] : null
        const timetableScope = extractScopeFromTimetable(firstTimetable)
        if (!mounted) return
        setScope(timetableScope)
      } catch (e) {
        if (!mounted) return
        setError(e?.response?.data?.error || e.message || 'Unable to resolve your class-teacher scope.')
      } finally {
        if (mounted) setLoadingScope(false)
      }
    }

    resolveScope()
    return () => {
      mounted = false
    }
  }, [user])

  async function loadStudentsAndAttendance() {
    if (!scope.classId) {
      setRows([])
      return
    }

    setLoadingStudents(true)
    setError('')
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        fetchStudents({ classId: scope.classId, section: scope.section || undefined, limit: 500 }),
        fetchStudentAttendance({ classId: scope.classId, section: scope.section || undefined, date }),
      ])

      const students = Array.isArray(studentsRes?.students) ? studentsRes.students : []
      const records = Array.isArray(attendanceRes?.records) ? attendanceRes.records : []

      const byStudentId = new Map()
      records.forEach((record) => {
        const sid = String(record?.student?._id || record?.student || '').trim()
        if (sid) byStudentId.set(sid, record)
      })

      const normalizedRows = students.map((student) => {
        const sid = String(student?._id || '').trim()
        const existing = byStudentId.get(sid)
        return {
          studentId: sid,
          studentName: String(student?.name || '').trim() || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student',
          studentCode: String(student?.studentId || student?.registrationNumber || '').trim() || '-',
          status: String(existing?.status || 'present').toLowerCase(),
          remarks: String(existing?.remarks || '').trim(),
        }
      })

      setRows(normalizedRows)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load class attendance roster.')
      setRows([])
    } finally {
      setLoadingStudents(false)
    }
  }

  useEffect(() => {
    loadStudentsAndAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.classId, scope.section, date])

  const summary = useMemo(() => {
    const total = rows.length
    const present = rows.filter((row) => row.status === 'present').length
    const absent = rows.filter((row) => row.status === 'absent').length
    const late = rows.filter((row) => row.status === 'late').length
    const excused = rows.filter((row) => row.status === 'excused').length
    return { total, present, absent, late, excused }
  }, [rows])

  function updateRow(studentId, patch) {
    setRows((prev) => prev.map((row) => (row.studentId === studentId ? { ...row, ...patch } : row)))
  }

  async function saveAll() {
    if (!rows.length) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await markStudentAttendance({
        date,
        entries: rows.map((row) => ({
          studentId: row.studentId,
          status: row.status,
          remarks: row.remarks,
        })),
      })

      const invalidCount = Array.isArray(res?.invalid) ? res.invalid.length : 0
      if (invalidCount > 0) {
        setError(`${invalidCount} entries were invalid and were not saved.`)
      } else {
        setSuccess(`Attendance saved for ${rows.length} students on ${date}.`)
      }

      await loadStudentsAndAttendance()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save attendance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Mark Class Attendance"
        subtitle="Mark or correct student attendance for your assigned class-teacher scope."
        right={<ButtonLink href="/teacher/attendance">Back</ButtonLink>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-700">{success}</div> : null}

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Date" type="date" value={date} max={toInputDate(new Date())} onChange={(e) => setDate(e.target.value)} />
          <Input label="Class" value={scope.classId || 'Not assigned'} disabled />
          <Input label="Section" value={scope.section || 'All'} disabled />
          <div className="flex items-end gap-2">
            <Button type="button" variant="secondary" onClick={loadStudentsAndAttendance} disabled={loadingStudents || loadingScope || !scope.classId}>Refresh</Button>
            <Button type="button" variant="primary" onClick={saveAll} disabled={saving || loadingStudents || !rows.length || !scope.classId}>
              {saving ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><div className="text-xs text-gray-500">Total</div><div className="text-xl font-semibold mt-1">{summary.total}</div></Card>
        <Card><div className="text-xs text-gray-500">Present</div><div className="text-xl font-semibold mt-1 text-green-700">{summary.present}</div></Card>
        <Card><div className="text-xs text-gray-500">Absent</div><div className="text-xl font-semibold mt-1 text-red-700">{summary.absent}</div></Card>
        <Card><div className="text-xs text-gray-500">Late</div><div className="text-xl font-semibold mt-1 text-amber-700">{summary.late}</div></Card>
        <Card><div className="text-xs text-gray-500">Excused</div><div className="text-xl font-semibold mt-1 text-purple-700">{summary.excused}</div></Card>
      </div>

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Students</h3>
        <div className="overflow-auto">
          {loadingScope || loadingStudents ? (
            <Skeleton className="h-64" />
          ) : !scope.classId ? (
            <div className="text-sm text-gray-600 py-4">No class-teacher scope detected. Please ask Admin/Principal to assign your class scope.</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600 py-4">No students found for your assigned class and section.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Student ID</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.studentId} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-2 px-4">{row.studentName}</td>
                    <td className="py-2 px-4">{row.studentCode}</td>
                    <td className="py-2 px-4 min-w-[160px]">
                      <Select
                        value={row.status}
                        onChange={(e) => updateRow(row.studentId, { status: e.target.value })}
                        options={ATTENDANCE_STATUS_OPTIONS}
                        disabled={saving}
                      />
                    </td>
                    <td className="py-2 px-4 min-w-[220px]">
                      <Input
                        value={row.remarks}
                        onChange={(e) => updateRow(row.studentId, { remarks: e.target.value })}
                        placeholder="Optional"
                        disabled={saving}
                      />
                    </td>
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
