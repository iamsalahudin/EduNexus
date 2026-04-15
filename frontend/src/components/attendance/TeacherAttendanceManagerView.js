"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import {
  exportStaffAttendance,
  fetchStaffAttendance,
  markStaffAttendance,
  updateStaffAttendance,
} from '@/services/attendanceService'
import { api } from '@/services/api'

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'leave', label: 'Leave' },
]

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function enumerateDates(fromDate, toDate, maxDays = 93) {
  const start = new Date(fromDate)
  const end = new Date(toDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []

  const dates = []
  const cursor = new Date(start)
  while (cursor <= end && dates.length < maxDays) {
    dates.push(toInputDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export default function TeacherAttendanceManagerView({
  roleBase = '/admin',
  backHref = '/admin/attendance',
  detailHrefBuilder,
  title = 'Teacher Attendance Management',
  subtitle = 'Mark and correct teacher attendance records by day or teacher.',
  allowUpdateExisting = true,
}) {
  const today = toInputDate(new Date())
  const weekAgo = toInputDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))

  const [mode, setMode] = useState('day')
  const [date, setDate] = useState(today)
  const [fromDate, setFromDate] = useState(weekAgo)
  const [toDate, setToDate] = useState(today)
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  const [teachers, setTeachers] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const maxDate = today

  useEffect(() => {
    let mounted = true

    async function loadTeachers() {
      try {
        const res = await api.get('/users', { params: { limit: 1200 } })
        const users = Array.isArray(res?.data?.users) ? res.data.users : []
        const list = users
          .filter((user) => String(user?.role || '').toLowerCase() === 'teacher')
          .map((user) => ({
            id: String(user?._id || ''),
            name: String(user?.name || user?.username || '').trim() || 'Teacher',
            department: String(user?.profile?.department || user?.profile?.subject || '').trim(),
          }))
          .filter((user) => user.id)
          .sort((a, b) => a.name.localeCompare(b.name))

        if (!mounted) return
        setTeachers(list)
        if (!selectedTeacherId && list.length) setSelectedTeacherId(list[0].id)
      } catch (e) {
        if (!mounted) return
        setError(e?.response?.data?.error || e.message || 'Failed to load teachers')
      }
    }

    loadTeachers()
    return () => {
      mounted = false
    }
  }, [])

  async function loadDayRows() {
    const attendanceRes = await fetchStaffAttendance({ role: 'Teacher', date })
    const records = Array.isArray(attendanceRes?.records) ? attendanceRes.records : []

    const byTeacher = new Map()
    for (const record of records) {
      const role = String(record?.user?.role || '').toLowerCase()
      if (role !== 'teacher') continue
      const id = String(record?.user?._id || '')
      if (!id) continue
      byTeacher.set(id, record)
    }

    return teachers.map((teacher) => {
      const existing = byTeacher.get(teacher.id)
      return {
        key: `${teacher.id}-${date}`,
        date,
        teacherId: teacher.id,
        teacherName: teacher.name,
        department: teacher.department,
        recordId: String(existing?._id || ''),
        status: String(existing?.status || 'present').toLowerCase(),
        remarks: String(existing?.remarks || ''),
      }
    })
  }

  async function loadTeacherRows() {
    if (!selectedTeacherId) return []

    const attendanceRes = await fetchStaffAttendance({ role: 'Teacher', userId: selectedTeacherId, fromDate, toDate })
    const records = Array.isArray(attendanceRes?.records) ? attendanceRes.records : []

    const byDate = new Map()
    for (const record of records) {
      const dateKey = toInputDate(record?.date)
      if (!dateKey) continue
      byDate.set(dateKey, record)
    }

    const selectedTeacher = teachers.find((teacher) => teacher.id === selectedTeacherId)
    const dates = enumerateDates(fromDate, toDate)

    return dates.map((dateKey) => {
      const existing = byDate.get(dateKey)
      return {
        key: `${selectedTeacherId}-${dateKey}`,
        date: dateKey,
        teacherId: selectedTeacherId,
        teacherName: selectedTeacher?.name || 'Teacher',
        department: selectedTeacher?.department || '',
        recordId: String(existing?._id || ''),
        status: String(existing?.status || 'present').toLowerCase(),
        remarks: String(existing?.remarks || ''),
      }
    })
  }

  async function load() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const nextRows = mode === 'day' ? await loadDayRows() : await loadTeacherRows()
      setRows(nextRows)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load attendance rows')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!teachers.length) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachers, mode, date, fromDate, toDate, selectedTeacherId])

  const summary = useMemo(() => {
    const total = rows.length
    const present = rows.filter((row) => row.status === 'present').length
    const absent = rows.filter((row) => row.status === 'absent').length
    const late = rows.filter((row) => row.status === 'late').length
    const leave = rows.filter((row) => row.status === 'leave').length
    return { total, present, absent, late, leave }
  }, [rows])

  function updateRow(rowKey, patch) {
    setRows((prev) => prev.map((row) => (row.key === rowKey ? { ...row, ...patch } : row)))
  }

  async function saveRow(row) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (row.recordId && allowUpdateExisting) {
        await updateStaffAttendance(row.recordId, { status: row.status, remarks: row.remarks })
      } else {
        await markStaffAttendance({
          userId: row.teacherId,
          date: row.date,
          status: row.status,
          remarks: row.remarks,
        })
      }
      setSuccess(`Attendance saved for ${row.teacherName} on ${row.date}`)
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      const params = mode === 'day'
        ? { role: 'Teacher', fromDate: date, toDate: date, format: 'csv' }
        : { role: 'Teacher', userId: selectedTeacherId || undefined, fromDate, toDate, format: 'csv' }

      const blob = await exportStaffAttendance(params)
      const fileName = mode === 'day'
        ? `teacher_attendance_${date}.csv`
        : `teacher_attendance_${selectedTeacherId || 'teacher'}_${fromDate}_to_${toDate}.csv`

      downloadBlob(blob, fileName)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to export attendance')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={<ButtonLink href={backHref} variant="secondary">Back</ButtonLink>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-700">{success}</div> : null}

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            label="Selection Mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            options={[
              { value: 'day', label: 'Day Wise' },
              { value: 'teacher', label: 'Teacher Wise' },
            ]}
          />

          {mode === 'day' ? (
            <Input label="Date" type="date" value={date} max={maxDate} onChange={(e) => setDate(e.target.value)} />
          ) : (
            <Select
              label="Teacher"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              options={[
                { value: '', label: 'Select Teacher' },
                ...teachers.map((teacher) => ({ value: teacher.id, label: teacher.name })),
              ]}
            />
          )}

          {mode === 'teacher' ? (
            <>
              <Input label="From" type="date" value={fromDate} max={maxDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input label="To" type="date" value={toDate} max={maxDate} onChange={(e) => setToDate(e.target.value)} />
            </>
          ) : (
            <div className="md:col-span-2" />
          )}

          <div className="flex items-end gap-2">
            <Button type="button" variant="secondary" onClick={load} disabled={loading || saving}>Refresh</Button>
            <Button type="button" variant="outline" onClick={handleExport} disabled={loading || exporting || saving}>Export CSV</Button>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><div className="text-xs text-gray-500">Total Rows</div><div className="text-xl font-semibold mt-1">{summary.total}</div></Card>
        <Card><div className="text-xs text-gray-500">Present</div><div className="text-xl font-semibold mt-1 text-green-700">{summary.present}</div></Card>
        <Card><div className="text-xs text-gray-500">Absent</div><div className="text-xl font-semibold mt-1 text-red-700">{summary.absent}</div></Card>
        <Card><div className="text-xs text-gray-500">Late</div><div className="text-xl font-semibold mt-1 text-amber-700">{summary.late}</div></Card>
        <Card><div className="text-xs text-gray-500">Leave</div><div className="text-xl font-semibold mt-1 text-purple-700">{summary.leave}</div></Card>
      </div>

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Teacher Attendance Rows</h3>
        <div className="overflow-auto">
          {loading ? (
            <Skeleton className="h-64" />
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600 py-4">No attendance rows found for current filters.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Teacher</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Remarks</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const detailHref = typeof detailHrefBuilder === 'function'
                    ? detailHrefBuilder(row.teacherId)
                    : `${roleBase}/attendance/teachers/${row.teacherId}`

                  return (
                    <tr key={row.key} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-2 px-4">{row.date}</td>
                      <td className="py-2 px-4">
                        <ButtonLink href={detailHref} variant="outline" size="sm">{row.teacherName}</ButtonLink>
                      </td>
                      <td className="py-2 px-4">{row.department || '-'}</td>
                      <td className="py-2 px-4 min-w-[160px]">
                        <Select
                          value={row.status}
                          onChange={(e) => updateRow(row.key, { status: e.target.value })}
                          options={STATUS_OPTIONS}
                          disabled={saving}
                        />
                      </td>
                      <td className="py-2 px-4 min-w-[220px]">
                        <Input
                          value={row.remarks}
                          onChange={(e) => updateRow(row.key, { remarks: e.target.value })}
                          placeholder="Optional"
                          disabled={saving}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => saveRow(row)}
                          disabled={saving}
                        >
                          {row.recordId ? 'Update' : 'Mark'}
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
