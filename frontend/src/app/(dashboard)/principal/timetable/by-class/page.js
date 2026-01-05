'use client'

import React, { useMemo, useState } from 'react'
import ClassTimetableView from '@/components/timetable/ClassTimetableView'
import { mockTimetable } from '@/utils/mockTimetable'

export default function ByClassTimetablesPage() {
  // Use mockTimetable (structure from your mock)
  const timetable = mockTimetable

  // Build class list from config
  const classes = timetable.classes || []

  // selected class id for view
  const [selectedClass, setSelectedClass] = useState(classes.length ? classes[0].id : null)

  // derive available days that have data (non-null weeklyGrids entry OR fallback Monday)
  const availableDays = useMemo(() => {
    const allDays = Object.keys(timetable.weeklyGrids || {})
    // include days that either have non-null arrays or keep Monday if only Mon is filled
    const daysWithData = allDays.filter(d => {
      const arr = (timetable.weeklyGrids || {})[d]
      return Array.isArray(arr) && arr.length > 0
    })
    // if none found, fallback to days present in weeklyGrids (likely Mon)
    return daysWithData.length ? daysWithData : allDays
  }, [timetable])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Timetables — By Class</h1>
          <p className="text-sm text-gray-600 mt-1">View and export class-specific timetables (mock data).</p>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-4">
        <aside className="md:col-span-1 space-y-3">
          <div className="card p-3">
            <div className="text-sm font-medium mb-2">Classes</div>
            <div className="flex flex-col gap-2">
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  className={`text-left px-3 py-2 rounded border ${selectedClass === c.id ? 'border-theme-primary bg-theme-primary/10' : ''}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-3">
            <div className="text-sm font-medium mb-2">Available days</div>
            <div className="text-xs text-gray-600">
              Showing days that contain timetable data from mock timetable.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableDays.map(d => (
                <div key={d} className="px-2 py-1 border rounded text-sm">{d}</div>
              ))}
            </div>
          </div>
        </aside>

        <main className="md:col-span-3">
          {selectedClass ? (
            <ClassTimetableView
              timetable={timetable}
              classId={selectedClass}
            />
          ) : (
            <div className="card p-6 text-center text-gray-600">No class selected</div>
          )}
        </main>
      </div>
    </div>
  )
}
