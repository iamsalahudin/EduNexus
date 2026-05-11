<<<<<<< HEAD
"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, PageHeader } from '@/components/ui'
import SetupForm from '@/components/timetable/TimetableSetupForm'
import TimetableGrid from '@/components/timetable/TimetableGrid'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import teacherService from '@/services/teacher.service'
import timetableService from '@/services/timetableService'
import { buildApiSlotsFromWeeklyGrid, parseAcademicYearToNumber } from '@/utils/timetableTransform'

const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']

export default function CreateTimetablePage() {
  const router = useRouter()
  const [config, setConfig] = useState(null)
  const [subjectsByClass, setSubjectsByClass] = useState({})
  const [teachers, setTeachers] = useState([])
  const [rooms, setRooms] = useState([])
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const [grid, setGrid] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [teacherRes, roomRes] = await Promise.all([
          teacherService.listTeachers({ active: true, limit: 200 }),
          classesService.listRooms()
        ])
        if (!mounted) return
        const rows = Array.isArray(teacherRes?.teachers) ? teacherRes.teachers : []
        const pool = rows
          .map((t) => ({
            id: String(t?.user?._id || '').trim(),
            label: String(t?.user?.name || t?.user?.username || t?.employeeId || '').trim()
          }))
          .filter((t) => t.id)
        setTeachers(pool)
        setRooms(Array.isArray(roomRes?.rooms) ? roomRes.rooms : [])
      } catch {
        if (!mounted) return
        setTeachers([])
        setRooms([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Initialize grids once after setup form completion
  const handleSetupComplete = (cfg) => {
    setConfig(cfg)
    const initialGrid = JSON.parse(JSON.stringify(cfg.classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      periods: Object.fromEntries(cfg.timeSlots.map((ts) => [
        ts.label,
        { subject: null, teacher: null, room: null }
      ]))
    }))))
    setGrid(initialGrid)
  }

  useEffect(() => {
    let mounted = true
    if (!config) return
    ;(async () => {
      try {
        const { subjects } = await subjectsService.listSubjects({ active: true })
        if (!mounted) return
        const map = {}
        ;(Array.isArray(subjects) ? subjects : []).forEach((s) => {
          const cls = String(s?.className || '').trim()
          if (!cls) return
          if (!map[cls]) map[cls] = []
          map[cls].push({
            id: String(s?._id || '').trim(),
            label: String(s?.name || '').trim()
          })
        })

        const filtered = {}
        ;(config?.classes || []).forEach((c) => {
          const classId = String(c?.id || c?.name || '')
          const baseClass = String(c?.className || c?.name || c?.id || '')
          filtered[classId] = Array.isArray(map[baseClass]) ? map[baseClass] : []
        })
        setSubjectsByClass(filtered)
      } catch (e) {
        if (!mounted) return
        setSubjectsByClass({})
      }
    })()
    return () => {
      mounted = false
    }
  }, [config])

  function handleGridChange(updatedGrid) {
    setGrid(JSON.parse(JSON.stringify(updatedGrid)))
  }

  async function handleSaveTimetable() {
    if (!config) return
    setSaveError('')
    setSaving(true)

    try {
      const weeklyGrids = Object.fromEntries(
        WEEK_DAYS.map((day) => [day, JSON.parse(JSON.stringify(grid))])
      )

      const slots = buildApiSlotsFromWeeklyGrid({
        weeklyGrids,
        days: WEEK_DAYS,
        classes: config.classes,
        timeSlots: config.timeSlots
      })

      if (!slots.length) {
        setSaveError('No timetable slots available to save.')
        return
      }

      await timetableService.createTimetable({
        level: config.level,
        year: parseAcademicYearToNumber(config.academicYear),
        slots
      })

      router.push('/principal/timetable')
    } catch (e) {
      setSaveError(e?.response?.data?.error || 'Failed to save timetable')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <PageHeader
        title="Create Timetable"
        subtitle="Create one timetable per level and apply it to all classes in that level."
      />

      {saveError ? <div className="text-sm text-red-600">{saveError}</div> : null}

      {!config && (
        <SetupForm
          onComplete={handleSetupComplete}
        />
      )}

      {config && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted">Timetable</div>
              <div className="font-medium">{config.name} · {config.academicYear} · {config.level}</div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfig(null)}>
                ← Back
              </Button>
              <Button variant="primary" onClick={handleSaveTimetable} disabled={saving}>
                {saving ? 'Saving...' : 'Save Timetable'}
              </Button>
            </div>
          </div>

          <TimetableGrid
            config={config}
            teachers={teachers}
            rooms={rooms}
            subjectsByClass={subjectsByClass}
            initialGrid={grid}
            onGridChange={handleGridChange}
          />
        </>
      )}
    </div>
  )
}

=======
"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, PageHeader } from '@/components/ui'
import SetupForm from '@/components/timetable/TimetableSetupForm'
import TimetableGrid from '@/components/timetable/TimetableGrid'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import teacherService from '@/services/teacher.service'
import timetableService from '@/services/timetableService'
import { buildApiSlotsFromWeeklyGrid, parseAcademicYearToNumber } from '@/utils/timetableTransform'

const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']

export default function CreateTimetablePage() {
  const router = useRouter()
  const [config, setConfig] = useState(null)
  const [subjectsByClass, setSubjectsByClass] = useState({})
  const [teachers, setTeachers] = useState([])
  const [rooms, setRooms] = useState([])
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const [grid, setGrid] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [teacherRes, roomRes] = await Promise.all([
          teacherService.listTeachers({ active: true, limit: 200 }),
          classesService.listRooms()
        ])
        if (!mounted) return
        const rows = Array.isArray(teacherRes?.teachers) ? teacherRes.teachers : []
        const pool = rows
          .map((t) => ({
            id: String(t?.user?._id || '').trim(),
            label: String(t?.user?.name || t?.user?.username || t?.employeeId || '').trim()
          }))
          .filter((t) => t.id)
        setTeachers(pool)
        setRooms(Array.isArray(roomRes?.rooms) ? roomRes.rooms : [])
      } catch {
        if (!mounted) return
        setTeachers([])
        setRooms([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Initialize grids once after setup form completion
  const handleSetupComplete = (cfg) => {
    setConfig(cfg)
    const initialGrid = JSON.parse(JSON.stringify(cfg.classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      periods: Object.fromEntries(cfg.timeSlots.map((ts) => [
        ts.label,
        { subject: null, teacher: null, room: null }
      ]))
    }))))
    setGrid(initialGrid)
  }

  useEffect(() => {
    let mounted = true
    if (!config) return
    ;(async () => {
      try {
        const { subjects } = await subjectsService.listSubjects({ active: true })
        if (!mounted) return
        const map = {}
        ;(Array.isArray(subjects) ? subjects : []).forEach((s) => {
          const cls = String(s?.className || '').trim()
          if (!cls) return
          if (!map[cls]) map[cls] = []
          map[cls].push({
            id: String(s?._id || '').trim(),
            label: String(s?.name || '').trim()
          })
        })

        const filtered = {}
        ;(config?.classes || []).forEach((c) => {
          const classId = String(c?.id || c?.name || '')
          const baseClass = String(c?.className || c?.name || c?.id || '')
          filtered[classId] = Array.isArray(map[baseClass]) ? map[baseClass] : []
        })
        setSubjectsByClass(filtered)
      } catch (e) {
        if (!mounted) return
        setSubjectsByClass({})
      }
    })()
    return () => {
      mounted = false
    }
  }, [config])

  function handleGridChange(updatedGrid) {
    setGrid(JSON.parse(JSON.stringify(updatedGrid)))
  }

  async function handleSaveTimetable() {
    if (!config) return
    setSaveError('')
    setSaving(true)

    try {
      const weeklyGrids = Object.fromEntries(
        WEEK_DAYS.map((day) => [day, JSON.parse(JSON.stringify(grid))])
      )

      const slots = buildApiSlotsFromWeeklyGrid({
        weeklyGrids,
        days: WEEK_DAYS,
        classes: config.classes,
        timeSlots: config.timeSlots
      })

      if (!slots.length) {
        setSaveError('No timetable slots available to save.')
        return
      }

      await timetableService.createTimetable({
        level: config.level,
        year: parseAcademicYearToNumber(config.academicYear),
        slots
      })

      router.push('/principal/timetable')
    } catch (e) {
      setSaveError(e?.response?.data?.error || 'Failed to save timetable')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <PageHeader
        title="Create Timetable"
        subtitle="Create one timetable per level and apply it to all classes in that level."
      />

      {saveError ? <div className="text-sm text-red-600">{saveError}</div> : null}

      {!config && (
        <SetupForm
          onComplete={handleSetupComplete}
        />
      )}

      {config && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted">Timetable</div>
              <div className="font-medium">{config.name} · {config.academicYear} · {config.level}</div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfig(null)}>
                ← Back
              </Button>
              <Button variant="primary" onClick={handleSaveTimetable} disabled={saving}>
                {saving ? 'Saving...' : 'Save Timetable'}
              </Button>
            </div>
          </div>

          <TimetableGrid
            config={config}
            teachers={teachers}
            rooms={rooms}
            subjectsByClass={subjectsByClass}
            initialGrid={grid}
            onGridChange={handleGridChange}
          />
        </>
      )}
    </div>
  )
}

>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
