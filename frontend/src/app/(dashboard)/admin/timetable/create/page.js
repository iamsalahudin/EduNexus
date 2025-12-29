'use client'

import React, { useState } from 'react'
import SetupForm from '@/components/timetable/TimetableSetupForm'
import TimetableGrid from '@/components/timetable/TimetableGrid'
import WeekSelector from '@/components/timetable/WeekSelector'
import { mockTeachers, mockRooms, mockSubjects } from '@/utils/mockData'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']

export default function CreateTimetablePage() {
  const [config, setConfig] = useState(null)

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
      <div>
        <h1 className="text-2xl font-semibold">Create Timetable</h1>
        <p className="text-sm text-gray-600 mt-1">
          Configure metadata, build timeslots and assign teachers / rooms / subjects.
        </p>
      </div>

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
              <button
                onClick={() => setConfig(null)}
                className="px-3 py-2 border rounded"
              >
                ← Back
              </button>
              <button
                onClick={() => console.log('Mock Save Payload', gridsByDay)}
                className="btn-primary p-2 rounded"
              >
                Save Timetable
              </button>
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
                <button
                  key={d}
                  onClick={() => handleDaySelect(d)}
                  className={`px-3 py-1 rounded border ${activeDay === d ? 'border-[--color-primary] bg-[--color-primary]/10' : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Timetable Grid */}
          <TimetableGrid
            config={config}
            teachers={mockTeachers}
            rooms={mockRooms}
            subjectsByClass={mockSubjects}
            initialGrid={gridsByDay[activeDay]}
            onGridChange={handleGridChange}
          />
        </>
      )}
    </div>
  )
}
