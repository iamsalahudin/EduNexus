"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton, Table, TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { fetchStudents, fetchStudentAttendance, markStudentAttendance } from '@/services/attendanceService'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' }
]

export default function StudentAttendancePage() {
  const { user } = useAuth()
  const [date, setDate] = useState(toInputDate(new Date()))
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])
  const [invalid, setInvalid] = useState([])

  const isClassLocked = useMemo(() => {
    const cls = user?.profile?.class || user?.profile?.classId || user?.profile?.assignedClass
    return !!cls
  }, [user])

  useEffect(() => {
    const cls = user?.profile?.class || user?.profile?.classId || user?.profile?.assignedClass || ''
    const sec = user?.profile?.section || user?.profile?.assignedSection || ''
    if (cls) setClassId(String(cls))
    if (sec) setSection(String(sec))
  }, [user])

  async function load() {
    if (!classId) {
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    setInvalid([])
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        fetchStudents({ classId, section: section || undefined, limit: 500 }),
        fetchStudentAttendance({ classId, date })
      ])
      const students = studentsRes.students || []
      const records = attendanceRes.records || []

      const recordByStudentId = new Map()
      for (const r of records) {
        const sid = r?.student?._id || r?.student
        if (sid) recordByStudentId.set(String(sid), r)
      }

      setRows(
        students.map((s) => {
          const existing = recordByStudentId.get(String(s._id))
          return {
            student: s,
            recordId: existing?._id || null,
            status: existing?.status || 'present'
          }
        })
      )
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load roster')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, section, date])

  function setStatus(studentId, status) {
    setRows((prev) =>
      prev.map((r) =>
        String(r.student._id) === String(studentId) ? { ...r, status } : r
      )
    )
  }

  async function onSave() {
    setLoading(true)
    setError(null)
    setInvalid([])
    try {
      const entries = rows.map((r) => ({
        studentId: r.student._id,
        status: r.status
      }))
      const res = await markStudentAttendance({ date, entries })
      setInvalid(res.invalid || [])
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save attendance')
      const inv = e?.response?.data?.invalid
      if (Array.isArray(inv)) setInvalid(inv)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Student Attendance" subtitle="Mark and update attendance for your class." />

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} inputClassName="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Class</label>
            <Input
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              placeholder="e.g. 10"
              disabled={isClassLocked}
              inputClassName="mt-2"
            />
            {isClassLocked ? <div className="text-xs text-gray-500 mt-1">Locked by your profile</div> : null}
          </div>
          <div>
            <label className="text-sm font-medium">Section (optional)</label>
            <Input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. A"
              disabled={!!(user?.profile?.section || user?.profile?.assignedSection)}
              inputClassName="mt-2"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Button variant="primary" onClick={onSave} disabled={loading || rows.length === 0}>
            {loading ? 'Saving...' : 'Save Attendance'}
          </Button>
          <Button onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
        {invalid.length ? (
          <div className="mt-4 text-sm text-amber-700">
            Some students were skipped: {invalid.map((x) => x.studentId).join(', ')}
          </div>
        ) : null}
      </Card>

      <Card className="mt-6">
        <h3 className="font-medium">Roster</h3>
        <div className="mt-3 overflow-auto">
          {loading && rows.length === 0 ? (
            <Skeleton className="h-40" />
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">No students found for this class/section.</div>
          ) : (
            <Table>
              <TableRoot className="min-w-full text-sm">
                <TableHead>
                  <TableRow className="text-left border-b">
                    <TableHeader>Student</TableHeader>
                    <TableHeader>ID</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.student._id}>
                      <TableCell>
                        {r.student.firstName} {r.student.lastName}
                      </TableCell>
                      <TableCell>{r.student.studentId}</TableCell>
                      <TableCell>
                        <Select value={r.status} onChange={(e) => setStatus(r.student._id, e.target.value)}>
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}

