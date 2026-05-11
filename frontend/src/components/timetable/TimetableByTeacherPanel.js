"use client"

import { useEffect, useMemo, useState } from 'react'
import TimetableSlotsBoard from '@/components/timetable/TimetableSlotsBoard'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import teacherService from '@/services/teacher.service'
import timetableService from '@/services/timetableService'

function teacherIdOf(slot) {
  if (!slot?.teacher) return ''
  if (typeof slot.teacher === 'string') return slot.teacher
  return String(slot.teacher?._id || slot.teacher?.id || '')
}

function teacherNameOf(slot) {
  if (!slot?.teacher) return '—'
  if (typeof slot.teacher === 'string') return slot.teacher
  return String(slot.teacher?.name || slot.teacher?.username || slot.teacher?._id || '—')
}

function normalizeTeacherTimetable(rows, teacherId) {
  const slots = rows.map((row) => ({
    day: row.day,
    startTime: String(row.time || '').split(' - ')[0] || '',
    endTime: String(row.time || '').split(' - ')[1] || '',
    class: row.class,
    section: row.section,
    room: row.room,
    subject: { name: row.subject },
    teacher: { _id: teacherId, name: row.teacherName },
  }))

  const first = rows[0] || {}
  return {
    level: first.level || '—',
    year: first.year || '—',
    slots,
  }
}

export default function TimetableByTeacherPanel({ roleBase = '/admin' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [teachers, setTeachers] = useState([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [rows, setRows] = useState([])

  async function loadTeachers() {
    const res = await teacherService.listTeachers({ active: true, limit: 500 })
    const list = Array.isArray(res?.teachers) ? res.teachers : []
    return list
      .map((item) => ({
        id: String(item?.user?._id || '').trim(),
        label: String(item?.user?.name || item?.user?.username || item?.employeeId || '').trim(),
      }))
      .filter((item) => item.id)
  }

  async function loadTimetables(teacherId) {
    const res = await timetableService.listTimetables({ teacher: teacherId, isActive: true })
    const list = Array.isArray(res?.timetables) ? res.timetables : []

    return list.flatMap((timetable) => {
      const slots = Array.isArray(timetable?.slots) ? timetable.slots : []
      return slots
        .filter((slot) => teacherIdOf(slot) === teacherId)
        .map((slot) => ({
          key: `${timetable?._id}-${slot?.day}-${slot?.startTime}-${slot?.class || ''}`,
          day: slot?.day || '—',
          time: `${slot?.startTime || ''} - ${slot?.endTime || ''}`,
          class: slot?.class || '—',
          section: slot?.section || '—',
          subject: slot?.subject?.name || '—',
          room: slot?.room || '—',
          level: timetable?.level || '—',
          year: timetable?.year || '—',
          teacherName: teacherNameOf(slot),
        }))
    })
  }

  async function bootstrap() {
    setLoading(true)
    setError('')
    try {
      const teacherRows = await loadTeachers()
      setTeachers(teacherRows)
      const firstId = teacherRows[0]?.id || ''
      setSelectedTeacherId(firstId)

      if (firstId) {
        const scheduleRows = await loadTimetables(firstId)
        setRows(scheduleRows)
      } else {
        setRows([])
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teacher timetable')
      setRows([])
      setTeachers([])
      setSelectedTeacherId('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    bootstrap()
  }, [])

  async function onTeacherChange(id) {
    setSelectedTeacherId(id)
    if (!id) {
      setRows([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const scheduleRows = await loadTimetables(id)
      setRows(scheduleRows)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teacher timetable')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    const classes = new Set(rows.map((r) => r.class).filter((c) => c && c !== '—'))
    return { periods: rows.length, classes: classes.size }
  }, [rows])

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <PageHeader
        title="Timetable — By Teacher"
        subtitle="Choose a teacher and view all assigned periods across level timetables."
        right={<Button variant="outline" onClick={bootstrap} disabled={loading}>Refresh</Button>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select label="Teacher" value={selectedTeacherId} onChange={(e) => onTeacherChange(e.target.value)}>
          {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.label}</option>)}
        </Select>
        <div>
          <div className="text-sm text-gray-600">Assigned Periods</div>
          <div className="text-xl font-semibold mt-1">{loading ? '...' : summary.periods}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Distinct Classes</div>
          <div className="text-xl font-semibold mt-1">{loading ? '...' : summary.classes}</div>
        </div>
      </Card>

      <Card className="overflow-auto">
        {loading ? (
          <Skeleton className="h-48" />
        ) : !rows.length ? (
          <div className="p-6 text-center text-gray-500">No assigned periods found.</div>
        ) : (
          <TimetableSlotsBoard
            timetable={normalizeTeacherTimetable(rows, selectedTeacherId)}
            viewRole="by-teacher"
          />
        )}
      </Card>
    </div>
  )
}
