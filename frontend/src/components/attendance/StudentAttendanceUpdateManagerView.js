<<<<<<< HEAD
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import { fetchStudentAttendance, updateStudentAttendance } from '@/services/attendanceService'
import classesService from '@/services/classesService'

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
  { value: 'excused', label: 'Excused' },
]

export default function StudentAttendanceUpdateManagerView({
  roleBase = '/admin',
  title = 'Student Attendance',
  subtitle = 'Update existing attendance records by class and date.',
}) {
  const [date, setDate] = useState(toInputDate(new Date()))
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [classes, setClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(true)

  // Load available classes on mount
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await classesService.listClasses()
        setClasses(Array.isArray(res?.classes) ? res.classes : [])
      } catch (e) {
        console.error('Failed to load classes:', e)
        setClasses([])
      } finally {
        setClassesLoading(false)
      }
    }
    loadClasses()
  }, [])

  // Get unique sections for the selected class
  const sectionsForClass = useMemo(() => {
    if (!classId) return []
    const selectedClass = classes.find((c) => String(c._id || c.name) === classId)
    if (!selectedClass) return []
    const sectionArray = selectedClass.sections || []
    return Array.isArray(sectionArray) ? sectionArray.filter(Boolean) : []
  }, [classId, classes])

  async function load() {
    if (!classId.trim()) {
      setRows([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetchStudentAttendance({
        classId: classId.trim(),
        section: section.trim() || undefined,
        date,
      })
      const records = Array.isArray(res?.records) ? res.records : []
      setRows(
        records.map((record) => ({
          recordId: String(record?._id || ''),
          status: String(record?.status || 'present').toLowerCase(),
          remarks: String(record?.remarks || ''),
          record,
        }))
      )
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load attendance records')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, section, date])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const studentName = `${row?.record?.student?.firstName || ''} ${row?.record?.student?.lastName || ''}`.toLowerCase()
      const studentRoll = String(row?.record?.student?.studentId || '').toLowerCase()
      return studentName.includes(q) || studentRoll.includes(q)
    })
  }, [rows, search])

  function updateRow(recordId, patch) {
    setRows((prev) => prev.map((row) => (row.recordId === recordId ? { ...row, ...patch } : row)))
  }

  async function saveRow(row) {
    if (!row?.recordId) return
    setSavingId(row.recordId)
    setError('')
    try {
      await updateStudentAttendance(row.recordId, {
        status: row.status,
        remarks: row.remarks,
      })
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to update attendance')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={<ButtonLink href={`${roleBase}/attendance`} variant="secondary">Back</ButtonLink>}
      />

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="Class" value={classId} onChange={(e) => { setClassId(e.target.value); setSection('') }} disabled={classesLoading}>
            <option value="">-- Select Class --</option>
            {classes.map((cls) => (
              <option key={String(cls._id || cls.name)} value={String(cls._id || cls.name)}>
                {cls.name}
              </option>
            ))}
          </Select>
          <Select label="Section (optional)" value={section} onChange={(e) => setSection(e.target.value)} disabled={!classId || sectionsForClass.length === 0}>
            <option value="">-- All Sections --</option>
            {sectionsForClass.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </Select>
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student name or ID" />
        </div>

        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>
        </div>
        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </Card>

      <Card className="mt-6">
        <h3 className="font-medium">Existing Records (Update Only)</h3>
        <div className="mt-3 overflow-auto">
          {loading && rows.length === 0 ? (
            <Skeleton className="h-40" />
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">
              No records found for this date and class. Create/mark attendance is not available on this page.
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-sm text-gray-600">No matching records for the current search.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Remarks</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const studentId = String(row?.record?.student?._id || '')
                  const studentName = `${row?.record?.student?.firstName || ''} ${row?.record?.student?.lastName || ''}`.trim() || 'Student'
                  return (
                    <tr key={row.recordId} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">
                        {studentId ? (
                          <ButtonLink href={`${roleBase}/attendance/students/${studentId}`} variant="outline" size="sm">
                            {studentName}
                          </ButtonLink>
                        ) : (
                          studentName
                        )}
                      </td>
                      <td className="py-2 pr-3">{row?.record?.student?.studentId || '-'}</td>
                      <td className="py-2 pr-3 min-w-[160px]">
                        <Select value={row.status} onChange={(e) => updateRow(row.recordId, { status: e.target.value })}>
                          {STATUSES.map((statusItem) => (
                            <option key={statusItem.value} value={statusItem.value}>{statusItem.label}</option>
                          ))}
                        </Select>
                      </td>
                      <td className="py-2 pr-3 min-w-[220px]">
                        <Input value={row.remarks} onChange={(e) => updateRow(row.recordId, { remarks: e.target.value })} placeholder="Optional remarks" />
                      </td>
                      <td className="py-2 pr-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => saveRow(row)}
                          disabled={savingId === row.recordId}
                        >
                          {savingId === row.recordId ? 'Saving...' : 'Update'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
=======
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import { fetchStudentAttendance, updateStudentAttendance } from '@/services/attendanceService'

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
  { value: 'excused', label: 'Excused' },
]

export default function StudentAttendanceUpdateManagerView({
  roleBase = '/admin',
  title = 'Student Attendance',
  subtitle = 'Update existing attendance records by class and date.',
}) {
  const [date, setDate] = useState(toInputDate(new Date()))
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  async function load() {
    if (!classId.trim()) {
      setRows([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetchStudentAttendance({
        classId: classId.trim(),
        section: section.trim() || undefined,
        date,
      })
      const records = Array.isArray(res?.records) ? res.records : []
      setRows(
        records.map((record) => ({
          recordId: String(record?._id || ''),
          status: String(record?.status || 'present').toLowerCase(),
          remarks: String(record?.remarks || ''),
          record,
        }))
      )
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load attendance records')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, section, date])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const studentName = `${row?.record?.student?.firstName || ''} ${row?.record?.student?.lastName || ''}`.toLowerCase()
      const studentRoll = String(row?.record?.student?.studentId || '').toLowerCase()
      return studentName.includes(q) || studentRoll.includes(q)
    })
  }, [rows, search])

  function updateRow(recordId, patch) {
    setRows((prev) => prev.map((row) => (row.recordId === recordId ? { ...row, ...patch } : row)))
  }

  async function saveRow(row) {
    if (!row?.recordId) return
    setSavingId(row.recordId)
    setError('')
    try {
      await updateStudentAttendance(row.recordId, {
        status: row.status,
        remarks: row.remarks,
      })
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to update attendance')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={<ButtonLink href={`${roleBase}/attendance`} variant="secondary">Back</ButtonLink>}
      />

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g. 10" />
          <Input label="Section (optional)" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" />
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student name or ID" />
        </div>

        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>
        </div>
        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </Card>

      <Card className="mt-6">
        <h3 className="font-medium">Existing Records (Update Only)</h3>
        <div className="mt-3 overflow-auto">
          {loading && rows.length === 0 ? (
            <Skeleton className="h-40" />
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">
              No records found for this date and class. Create/mark attendance is not available on this page.
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-sm text-gray-600">No matching records for the current search.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Remarks</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const studentId = String(row?.record?.student?._id || '')
                  const studentName = `${row?.record?.student?.firstName || ''} ${row?.record?.student?.lastName || ''}`.trim() || 'Student'
                  return (
                    <tr key={row.recordId} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">
                        {studentId ? (
                          <ButtonLink href={`${roleBase}/attendance/students/${studentId}`} variant="outline" size="sm">
                            {studentName}
                          </ButtonLink>
                        ) : (
                          studentName
                        )}
                      </td>
                      <td className="py-2 pr-3">{row?.record?.student?.studentId || '-'}</td>
                      <td className="py-2 pr-3 min-w-[160px]">
                        <Select value={row.status} onChange={(e) => updateRow(row.recordId, { status: e.target.value })}>
                          {STATUSES.map((statusItem) => (
                            <option key={statusItem.value} value={statusItem.value}>{statusItem.label}</option>
                          ))}
                        </Select>
                      </td>
                      <td className="py-2 pr-3 min-w-[220px]">
                        <Input value={row.remarks} onChange={(e) => updateRow(row.recordId, { remarks: e.target.value })} placeholder="Optional remarks" />
                      </td>
                      <td className="py-2 pr-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => saveRow(row)}
                          disabled={savingId === row.recordId}
                        >
                          {savingId === row.recordId ? 'Saving...' : 'Update'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
