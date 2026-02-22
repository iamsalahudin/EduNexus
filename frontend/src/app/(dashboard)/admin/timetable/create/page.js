"use client"

import React, { useEffect, useMemo, useState } from 'react'
import SetupForm from '@/components/timetable/TimetableSetupForm'
import TimetableGrid from '@/components/timetable/TimetableGrid'
import WeekSelector from '@/components/timetable/WeekSelector'
import { mockTeachers, mockRooms } from '@/utils/mockData'
import subjectsService from '@/services/subjectsService'
import { Button, PageHeader } from '@/components/ui'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']

export default function CreateTimetablePage() {
  const [config, setConfig] = useState(null)
  const [subjectsByClass, setSubjectsByClass] = useState({})

  // Week config
  const [weekConfig, setWeekConfig] = useState({
    mode: 'same',
    days: ['Mon','Tue','Wed','Thu','Fri', 'Sat'],
  })

  // Active day for editing (used when mode = 'different')
  const [activeDay, setActiveDay] = useState('Mon')

  // Grids per day
  const [gridsByDay, setGridsByDay] = useState({})

  // Initialize grids once after setup form completion
  const handleSetupComplete = (cfg) => {
    setConfig(cfg)
    const initialGrid = {} 
    DAYS.forEach(day => {
      initialGrid[day] = JSON.parse(JSON.stringify(cfg.classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        periods: Object.fromEntries(cfg.timeSlots.map(ts => [
          ts.label,
          { subject: null, teacher: null, room: null }
        ]))
      }))))
    })
    setGridsByDay(initialGrid)
    setActiveDay('Mon')
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
          map[cls].push(String(s?.name || '').trim())
        })

        // Filter to only selected classes in config
        const filtered = {}
        ;(config?.classes || []).forEach((c) => {
          const id = String(c?.id || c?.name || '')
          filtered[id] = Array.isArray(map[id]) ? map[id] : []
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

  // Handle grid changes
  function handleGridChange(updatedGrid) {
    if (weekConfig.mode === 'same') {
      // Apply to all days
      const newGrids = {}
      weekConfig.days.forEach(d => newGrids[d] = JSON.parse(JSON.stringify(updatedGrid)))
      setGridsByDay(newGrids)
    } else {
      // Apply only to active day
      setGridsByDay(prev => ({ ...prev, [activeDay]: JSON.parse(JSON.stringify(updatedGrid)) }))
    }
  }

  // Handle day selection (only for 'different' mode)
  function handleDaySelect(day) {
    setActiveDay(day)
  }

  // When switching mode
  function handleWeekModeChange(newConfig) {
    if (newConfig.mode === 'same' && weekConfig.mode === 'different') {
      if (!confirm('Switching to "same for whole week" will overwrite all individual day edits. Proceed?')) return
      // Copy Monday grid to all days
      const newGrids = {}
      DAYS.forEach(d => newGrids[d] = JSON.parse(JSON.stringify(gridsByDay['Mon'])))
      setGridsByDay(newGrids)
      setActiveDay('Mon')
    }

    if (newConfig.mode === 'different' && weekConfig.mode === 'same') {
      // When changing from same -> different
      // Keep Monday as it is, other days empty
      const newGrids = {}
      DAYS.forEach((d,i) => {
        if (i === 0) newGrids[d] = JSON.parse(JSON.stringify(gridsByDay[d])) // Monday
        else newGrids[d] = JSON.parse(JSON.stringify(gridsByDay[d].map(c => ({
          id: c.id,
          name: c.name,
          periods: Object.fromEntries(Object.entries(c.periods).map(([time]) => [time, {subject:null,teacher:null,room:null}]))
        }))))
      })
      setGridsByDay(newGrids)
      setActiveDay('Mon')
    }

    setWeekConfig(newConfig)
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <PageHeader
        title="Create Timetable"
        subtitle="Configure metadata, build timeslots and assign teachers / rooms / subjects."
      />

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
              <div className="font-medium">{config.name} · {config.academicYear}</div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setConfig(null)}>
                ← Back
              </Button>
              <Button type="button" variant="primary" onClick={() => console.log('Mock Save Payload', gridsByDay)}>
                Save Timetable
              </Button>
            </div>
          </div>

          {/* Week Selector */}
          <WeekSelector 
            value={weekConfig} 
            onChange={handleWeekModeChange}
          />

          {/* Day toggle for 'different' mode */}
          {weekConfig.mode === 'different' && (
            <div className="flex gap-2">
              {weekConfig.days.map(d => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={activeDay === d ? 'primary' : 'secondary'}
                  onClick={() => handleDaySelect(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
          )}

          {/* Timetable Grid */}
          <TimetableGrid
            config={config}
            teachers={mockTeachers}
            rooms={mockRooms}
            subjectsByClass={subjectsByClass}
            initialGrid={gridsByDay[activeDay]}
            onGridChange={handleGridChange}
          />
        </>
      )}
    </div>
  )
}

