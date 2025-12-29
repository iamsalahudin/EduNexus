'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import DraggableItem from './DraggableItem'
import GridHeader from './GridHeader'
import GridCell from './GridCell'
import ValidationBar from './ValidationBar'

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function initEmptyGridFromConfig(config) {
  return config.classes.map(cls => ({
    id: cls.id,
    name: cls.name,
    periods: Object.fromEntries(config.timeSlots.map(ts => [ts.label, { subject: null, teacher: null, room: null }])),
  }))
}

/**
 * Normalize incoming initialGrid (from mock data) to the exact expected shape:
 * - Ensure each class from config.classes exists (match by id or name)
 * - Ensure each timeslot label exists in periods; fill missing with nulls
 */
function normalizeInitialGrid(initialGrid, config) {
  const timeLabels = config.timeSlots.map(ts => ts.label)

  // If no initialGrid provided, return fully empty grid
  if (!initialGrid || !Array.isArray(initialGrid)) {
    return initEmptyGridFromConfig(config)
  }

  // Build a lookup from initialGrid by id or name
  const lookup = {}
  initialGrid.forEach(item => {
    if (item && item.id) lookup[item.id] = item
    else if (item && item.name) lookup[item.name] = item
  })

  // For each class in config, produce a normalized entry
  const normalized = config.classes.map(cls => {
    const source = lookup[cls.id] || lookup[cls.name] || null

    const periods = {}
    timeLabels.forEach(label => {
      // If source has periods and value exists for the label, use it (safely)
      const v = source && source.periods && Object.prototype.hasOwnProperty.call(source.periods, label)
        ? source.periods[label]
        : null

      if (v && typeof v === 'object') {
        // ensure keys subject/teacher/room exist (avoid undefined)
        periods[label] = {
          subject: v.subject ?? null,
          teacher: v.teacher ?? null,
          room: v.room ?? null
        }
      } else {
        periods[label] = { subject: null, teacher: null, room: null }
      }
    })

    return {
      id: cls.id,
      name: cls.name,
      periods
    }
  })

  return normalized
}

export default function TimetableGrid({
  config,
  teachers = [],
  rooms = [],
  subjectsByClass = {},
  initialGrid = null,
  onGridChange = () => {}
}) {
  const timeLabels = useMemo(() => config.timeSlots.map(ts => ts.label), [config])

  // grid is always the active day's normalized grid
  const [grid, setGrid] = useState(() => normalizeInitialGrid(initialGrid, config))
  const [errors, setErrors] = useState([])
  const [history, setHistory] = useState([])

  // Whenever config or initialGrid changes (switching days), normalize and load
  useEffect(() => {
    const normalized = normalizeInitialGrid(initialGrid, config)
    setGrid(normalized)
    setHistory([deepCopy(normalized)]) // reset history for new day
    setErrors([])
    // notify parent purposely so it remains in sync (parent likely already has it)
    // onGridChange(normalized)
  }, [initialGrid, config])

  // History helpers
  function pushHistory(newGrid) {
    setHistory(h => [...h, deepCopy(newGrid)])
  }

  function undo() {
    if (history.length < 2) return
    setHistory(h => {
      const prev = [...h]
      prev.pop() // remove last
      const last = deepCopy(prev.at(-1))
      setGrid(last)
      // inform parent of restored grid
      onGridChange(last)
      return prev
    })
    setErrors([])
  }

  // Conflict helpers (use current grid)
  function teacherBusy(teacher, colId, time) {
    return grid.some(col => col.id !== colId && col.periods[time]?.teacher === teacher)
  }
  function roomBusy(room, colId, time) {
    return grid.some(col => col.id !== colId && col.periods[time]?.room === room)
  }

  // Apply changes
  function applyToColumn(type, value, colId) {
    const updated = grid.map(col =>
      col.id !== colId
        ? col
        : {
            ...col,
            periods: Object.fromEntries(Object.entries(col.periods).map(([k, v]) => [k, { ...v, [type]: value }]))
          }
    )
    pushHistory(updated)
    setGrid(updated)
    onGridChange(updated)
  }

  function applyToCell(type, value, colId, time) {
    const updated = grid.map(col =>
      col.id !== colId
        ? col
        : {
            ...col,
            periods: {
              ...col.periods,
              [time]: { ...col.periods[time], [type]: value }
            }
          }
    )
    pushHistory(updated)
    setGrid(updated)
    onGridChange(updated)
  }

  // Drag end handler
  function onDragEnd({ active, over }) {
    setErrors([])
    if (!over) return

    const [type, payload] = active.id.split(':')
    const target = over.id.split(':')

    // header drop -> apply to all periods of that column
    if (target[0] === 'header') {
      const colId = target[1]
      if (type === 'teacher') applyToColumn('teacher', payload, colId)
      if (type === 'room') applyToColumn('room', payload, colId)
      return
    }

    // cell drop -> apply to specific cell
    if (target[0] === 'cell') {
      const colId = target[1]
      const time = decodeURIComponent(target[2])

      if (type === 'subject') {
        const [classId, subject] = payload.split('|')
        if (classId !== colId) {
          setErrors(['Subject belongs to another class'])
          return
        }
        applyToCell('subject', subject, colId, time)
      } else if (type === 'teacher') {
        if (teacherBusy(payload, colId, time)) {
          setErrors([`Teacher "${payload}" already busy`])
          return
        }
        applyToCell('teacher', payload, colId, time)
      } else if (type === 'room') {
        if (roomBusy(payload, colId, time)) {
          setErrors([`Room "${payload}" already busy`])
          return
        }
        applyToCell('room', payload, colId, time)
      }
    }
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Drag teachers/rooms to column header → applies to all periods. Subjects to cells.
        </div>

        <button
          onClick={undo}
          disabled={history.length < 2}
          className={`px-3 py-2 border rounded text-sm ${history.length >= 2 ? 'hover-theme-primary' : 'opacity-50 cursor-not-allowed'}`}
        >
          ⟲ Undo
        </button>
      </div>

      <ValidationBar errors={errors} />

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="mt-4 flex gap-6">
          {/* Left pools */}
          <div className="w-64 space-y-6">
            <div>
              <div className="text-sm font-medium mb-2">Teachers</div>
              <div className="flex flex-col gap-2">
                {teachers.map(t => <DraggableItem key={t} id={`teacher:${t}`} label={t} />)}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Rooms</div>
              <div className="flex flex-col gap-2">
                {rooms.map(r => <DraggableItem key={r} id={`room:${r}`} label={r} />)}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Subjects</div>
              <div className="space-y-3">
                {Object.entries(subjectsByClass).map(([classId, subjects]) => {
                  // show only if class exists in grid
                  if (!grid.find(c => c.id === classId)) return null
                  return (
                    <div key={classId}>
                      <div className="text-xs font-semibold text-gray-600 mb-1">{classId}</div>
                      <div className="flex flex-wrap gap-2">
                        {subjects.map(sub => (
                          <DraggableItem key={`${classId}-${sub}`} id={`subject:${classId}|${sub}`} label={sub} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid gap-px bg-gray-300" style={{ gridTemplateColumns: `120px repeat(${grid.length}, 1fr)` }}>
              <div className="bg-white p-2" /> {/* top-left corner */}
              {grid.map(col => <GridHeader key={col.id} col={col} />)}

              {timeLabels.map(label => (
                <React.Fragment key={label}>
                  <div className="bg-white p-2 font-medium">{label}</div>
                  {grid.map(col => (
                    <GridCell key={`${col.id}:${label}`} col={col} timeLabel={label} />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  )
}
