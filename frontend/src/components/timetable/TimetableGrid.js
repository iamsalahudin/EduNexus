'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
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

function normalizePoolItem(item) {
  if (item && typeof item === 'object') {
    const value = String(item.value || item.id || item._id || item.name || '').trim()
    const label = String(item.label || item.name || value).trim()
    return { value, label }
  }
  const text = String(item || '').trim()
  return { value: text, label: text }
}

function normalizeAssignedValue(value) {
  if (value && typeof value === 'object') {
    return {
      id: String(value.id || value._id || '').trim(),
      label: String(value.label || value.name || value.id || value._id || '').trim()
    }
  }
  const text = String(value || '').trim()
  return { id: text, label: text }
}

function parseDndId(rawId) {
  const parts = String(rawId || '').split('|')
  const type = parts[0] || ''
  const values = parts.slice(1).map((part) => decodeURIComponent(part || ''))
  return { type, values }
}

function trimText(value) {
  return String(value || '').trim()
}

/**
 * Normalize incoming initialGrid (from API/edit state) to the exact expected shape:
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
  const teacherItems = useMemo(() => (Array.isArray(teachers) ? teachers : []).map(normalizePoolItem), [teachers])
  const gridExportRef = useRef(null)

  // grid is always the active day's normalized grid
  const [grid, setGrid] = useState(() => normalizeInitialGrid(initialGrid, config))
  const [errors, setErrors] = useState([])
  const [history, setHistory] = useState([])

  // Compute all current conflicts in the grid
  const conflicts = useMemo(() => {
    const found = []
    const timeLabels = config.timeSlots.map(ts => ts.label)
    
    // Check for teacher double-booking across different classes
    timeLabels.forEach(time => {
      const teacherAssignments = {} // { teacherId: [{ classId, className, teacherLabel }] }
      
      grid.forEach(col => {
        const assigned = col.periods[time]?.teacher
        if (assigned) {
          const teacherId = normalizeAssignedValue(assigned).id
          if (!teacherAssignments[teacherId]) {
            teacherAssignments[teacherId] = []
          }
          teacherAssignments[teacherId].push({
            classId: col.id,
            className: col.name,
            teacherLabel: normalizeAssignedValue(assigned).label
          })
        }
      })
      
      // For each teacher, if assigned to multiple classes at same time, flag as conflict
      Object.entries(teacherAssignments).forEach(([teacherId, assignments]) => {
        if (assignments.length > 1) {
          found.push({
            type: 'teacher-double-booking',
            time,
            teacher: assignments[0].teacherLabel,
            classes: assignments.map(a => a.className).join(', ')
          })
        }
      })
    })
    
    return found
  }, [grid, config])

  // Compute warning messages from conflicts
  const warnings = useMemo(() => {
    return conflicts.map(c => {
      if (c.type === 'teacher-double-booking') {
        return `"${c.teacher}" is assigned to multiple classes at ${c.time}: ${c.classes}`
      }
      return ''
    }).filter(Boolean)
  }, [conflicts])

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
    const teacherId = normalizeAssignedValue(teacher).id
    return grid.some(col => {
      if (col.id === colId) return false
      const current = normalizeAssignedValue(col.periods[time]?.teacher).id
      return current && current === teacherId
    })
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

    const activeId = parseDndId(active?.id)
    const targetId = parseDndId(over?.id)

    // header drop -> apply to all periods of that column
    if (targetId.type === 'header') {
      const colId = targetId.values[0] || ''
      if (activeId.type === 'teacher') {
        const teacherId = activeId.values[0] || ''
        const teacherLabel = activeId.values[1] || teacherId
        applyToColumn('teacher', { id: teacherId, label: teacherLabel }, colId)
      }
      if (activeId.type === 'room') {
        applyToColumn('room', activeId.values[0] || '', colId)
      }
      return
    }

    // cell drop -> apply to specific cell
    if (targetId.type === 'cell') {
      const colId = targetId.values[0] || ''
      const time = targetId.values[1] || ''

      if (activeId.type === 'subject') {
        const classId = activeId.values[0] || ''
        const subjectId = activeId.values[1] || ''
        const subjectLabel = activeId.values[2] || subjectId
        if (classId !== colId) {
          setErrors(['This subject is assigned to a different class.'])
          return
        }
        applyToCell('subject', { id: subjectId, label: subjectLabel }, colId, time)
      } else if (activeId.type === 'teacher') {
        const teacherId = activeId.values[0] || ''
        const teacherLabel = activeId.values[1] || teacherId
        if (teacherBusy(teacherId, colId, time)) {
          setErrors([`Teacher "${teacherLabel}" is already assigned at this time.`])
          return
        }
        applyToCell('teacher', { id: teacherId, label: teacherLabel }, colId, time)
      } else if (activeId.type === 'room') {
        const roomValue = activeId.values[0] || ''
        if (roomBusy(roomValue, colId, time)) {
          setErrors([`Room "${roomValue}" is already in use at this time.`])
          return
        }
        applyToCell('room', roomValue, colId, time)
      }
    }
  }

  async function exportPDF() {
    try {
      if (!gridExportRef.current) return

      const html2canvas = (await import('html2canvas')).default
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default

      const element = gridExportRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('landscape', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = margin

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= (pageHeight - margin * 2)

      while (heightLeft > 0) {
        position -= (pageHeight - margin * 2)
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
        heightLeft -= (pageHeight - margin * 2)
      }

      const level = trimText(config?.level || config?.name || 'level')
      const year = trimText(config?.academicYear || config?.year || '')
      const fileName = year
        ? `timetable-${level}-${year}.pdf`
        : `timetable-${level}.pdf`

      pdf.save(fileName)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export is unavailable. Please try again.')
    }
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Drag teachers/rooms to a column header to apply all periods, or drop them on a single cell for one period. Subjects can be dropped only on individual cells.
        </div>

        <button
          onClick={undo}
          disabled={history.length < 2}
          className={`px-3 py-2 border rounded text-sm ${history.length >= 2 ? 'hover-theme-primary' : 'opacity-50 cursor-not-allowed'}`}
        >
          ⟲ Undo
        </button>

        <button
          type="button"
          onClick={exportPDF}
          className="px-3 py-2 border rounded text-sm hover-theme-primary"
        >
          Export PDF
        </button>
      </div>

      <ValidationBar errors={errors} />

      {warnings.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
          <div className="text-sm font-semibold text-amber-900 mb-2">Scheduling conflicts detected</div>
          <div className="space-y-1">
            {warnings.map((w, i) => (
              <div key={i} className="text-sm text-amber-800">{w}</div>
            ))}
          </div>
          <div className="text-xs text-amber-700 mt-2">Please resolve these conflicts before saving to prevent submission errors.</div>
        </div>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="mt-4 flex gap-6">
          {/* Left pools */}
          <div className="w-64 space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
            <div>
              <div className="text-sm font-medium mb-2">Teachers</div>
              <div className="flex flex-col gap-2">
                {teacherItems.map((t) => (
                  <DraggableItem
                    key={`teacher-${t.value}`}
                    id={`teacher|${encodeURIComponent(t.value)}|${encodeURIComponent(t.label)}`}
                    label={t.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Rooms</div>
              <div className="flex flex-col gap-2">
                {rooms.map(r => <DraggableItem key={r} id={`room|${encodeURIComponent(r)}`} label={r} />)}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Subjects</div>
              <div className="space-y-3">
                {Object.entries(subjectsByClass).map(([classId, subjects]) => {
                  // show only if class exists in grid
                  const classRow = grid.find(c => c.id === classId)
                  if (!classRow) return null
                  return (
                    <div key={classId}>
                      <div className="text-xs font-semibold text-gray-600 mb-1">{classRow.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {subjects.map((sub) => {
                          const item = normalizePoolItem(sub)
                          return (
                            <DraggableItem
                              key={`${classId}-${item.value}`}
                              id={`subject|${encodeURIComponent(classId)}|${encodeURIComponent(item.value)}|${encodeURIComponent(item.label)}`}
                              label={item.label}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-auto">
            <div ref={gridExportRef} className="grid gap-px bg-gray-300" style={{ gridTemplateColumns: `120px repeat(${grid.length}, 1fr)` }}>
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
