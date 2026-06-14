'use client'

import { useEffect, useState } from 'react'
import teacherService from '@/services/teacher.service'
import { Card, EmptyState, PageHeader, Select, Skeleton } from '@/components/ui'

export default function ClassStudentsPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')

  async function loadClasses() {
    setLoading(true)
    setError('')
    try {
      const res = await teacherService.getMyClasses()
      setClasses(Array.isArray(res?.classes) ? res.classes : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Class assignments are not available yet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  const selectedClass = classes.find((item) => String(item?._id) === String(selectedId))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Students"
        subtitle="Review students in your assigned classes."
      />

      {error ? <div className="text-sm text-amber-700">{error}</div> : null}

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium">Select a class</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose a class to review its student roster.
            </p>
          </div>
          <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Choose class</option>
            {classes.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-28" />
          ) : !selectedClass ? (
            <EmptyState
              title="Pick a class to continue"
              description="Student rosters will appear once you choose a class." 
            />
          ) : (
            <EmptyState
              title="Roster not available"
              description="Student roster access for teachers has not been enabled yet."
            />
          )}
        </div>
      </Card>
    </div>
  )
}
