'use client'

import React, { useMemo, useState } from 'react'
import ClassTimetableView from '@/components/timetable/ClassTimetableView'
import { mockTimetable } from '@/utils/mockTimetable'
import { Button, Card, PageHeader } from '@/components/ui'

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
      <PageHeader title="Timetables — By Class" subtitle="View and export class-specific timetables (mock data)." />

      <div className="grid md:grid-cols-4 gap-4">
        <aside className="md:col-span-1 space-y-3">
          <Card className="p-3">
            <div className="text-sm font-medium mb-2">Classes</div>
            <div className="flex flex-col gap-2">
              {classes.map(c => (
                <Button
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  variant={selectedClass === c.id ? 'primary' : 'secondary'}
                  className="justify-start"
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-sm font-medium mb-2">Available days</div>
            <div className="text-xs text-gray-600">
              Showing days that contain timetable data from mock timetable.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableDays.map(d => (
                <div key={d} className="px-2 py-1 border rounded text-sm">{d}</div>
              ))}
            </div>
          </Card>
        </aside>

        <main className="md:col-span-3">
          {selectedClass ? (
            <ClassTimetableView
              timetable={timetable}
              classId={selectedClass}
            />
          ) : (
            <Card className="p-6 text-center text-gray-600">No class selected</Card>
          )}
        </main>
      </div>
    </div>
  )
}
