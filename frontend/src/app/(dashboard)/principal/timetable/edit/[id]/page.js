"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from 'next/navigation'
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { Button, PageHeader } from '@/components/ui'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import teacherService from '@/services/teacher.service'
import timetableService from '@/services/timetableService'
import { buildApiSlotsFromWeeklyGrid, buildTimetableConfigFromApi } from '@/utils/timetableTransform'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function EditTimetablePage({ params }) {
  const router = useRouter()
  const timetableId = String(params?.id || '')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [teachers, setTeachers] = useState([])
  const [rooms, setRooms] = useState([])
  const [subjectsByClass, setSubjectsByClass] = useState({})

  const [timetable, setTimetable] = useState(null)
  const [grid, setGrid] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')

        const [timetableRes, teachersRes, subjectsRes, roomsRes] = await Promise.all([
          timetableService.getTimetable(timetableId),
          teacherService.listTeachers({ active: true, limit: 200 }),
          subjectsService.listSubjects({ active: true }),
          classesService.listRooms()
        ])

        if (!mounted) return

        const normalized = buildTimetableConfigFromApi(timetableRes?.timetable)
        setTimetable(normalized)

        const teacherPool = (Array.isArray(teachersRes?.teachers) ? teachersRes.teachers : [])
          .map((t) => ({
            id: String(t?.user?._id || '').trim(),
            label: String(t?.user?.name || t?.user?.username || t?.employeeId || '').trim()
          }))
          .filter((row) => row.id)
        setTeachers(teacherPool)
        setRooms(Array.isArray(roomsRes?.rooms) ? roomsRes.rooms : [])

        const map = {}
        ;(Array.isArray(subjectsRes?.subjects) ? subjectsRes.subjects : []).forEach((s) => {
          const cls = String(s?.className || '').trim()
          if (!cls) return
          if (!map[cls]) map[cls] = []
          map[cls].push({ id: String(s?._id || '').trim(), label: String(s?.name || '').trim() })
        })

        const filtered = {}
        ;(normalized?.classes || []).forEach((c) => {
          const classId = String(c?.id || '')
          const baseClass = String(c?.className || c?.name || c?.id || '')
          filtered[classId] = Array.isArray(map[baseClass]) ? map[baseClass] : []
        })
        setSubjectsByClass(filtered)

        const sourceDay = WEEK_DAYS.find((day) => {
          const dayGrid = normalized?.weeklyGrids?.[day] || []
          return dayGrid.some((cls) =>
            Object.values(cls?.periods || {}).some((cell) => cell?.subject || cell?.teacher || cell?.room)
          )
        })
        setGrid(JSON.parse(JSON.stringify(normalized?.weeklyGrids?.[sourceDay || 'Mon'] || [])))
      } catch (e) {
        if (!mounted) return
        setError(e?.response?.data?.error || 'Failed to load timetable')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [timetableId])

  const handleGridChange = (updatedGrid) => {
    setGrid(JSON.parse(JSON.stringify(updatedGrid)))
  };

  const activeSubjectsByClass = useMemo(() => subjectsByClass, [subjectsByClass])

  const handleSave = async () => {
    if (!timetable) return

    setSaving(true)
    setError('')
    try {
      const weeklyGrids = Object.fromEntries(
        WEEK_DAYS.map((day) => [day, JSON.parse(JSON.stringify(grid))])
      )

      const slots = buildApiSlotsFromWeeklyGrid({
        weeklyGrids,
        days: WEEK_DAYS,
        classes: timetable.classes,
        timeSlots: timetable.timeSlots
      })

      await timetableService.updateTimetable(timetableId, {
        level: timetable.level,
        year: timetable.year,
        slots
      })

      router.push('/principal/timetable')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save timetable changes')
    } finally {
      setSaving(false)
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <PageHeader title="Edit Timetable" subtitle="Loading timetable..." />
      </div>
    )
  }

  if (!timetable) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <PageHeader title="Edit Timetable" subtitle="Unable to load timetable." />
        {error ? <div className="text-sm text-red-600 mt-4">{error}</div> : null}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <PageHeader title="Edit Timetable" subtitle={`${timetable.level} · ${timetable.year}`} />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <TimetableGrid
        config={timetable}
        teachers={teachers}
        rooms={rooms}
        subjectsByClass={activeSubjectsByClass}
        initialGrid={grid}
        onGridChange={handleGridChange}
      />
    </div>
  );
}
