'use client'

import { useEffect, useState } from 'react'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'

export default function AssignSubjectToClassPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(res?.classes) ? res.classes : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function applyDefaults() {
    setError('')
    setSuccess('')
    try {
      if (!selectedClass) {
        setError('Select a class first')
        return
      }
      await subjectsService.applyDefaults({ className: selectedClass })
      setSuccess(`Defaults applied to ${selectedClass}`)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to apply defaults')
    }
  }

  async function applyDefaultsAll() {
    setError('')
    setSuccess('')
    try {
      await subjectsService.applyDefaults({})
      setSuccess('Defaults applied to all classes')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to apply defaults')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Assign Subject to Class" subtitle="Apply default subject sets to one class or all classes" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 p-6">
          {loading ? <Skeleton className="h-32" /> : (
            <div className="space-y-4">
              <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Select class</option>
                {classes.map((cls) => <option key={cls._id} value={cls.name}>{cls.name}</option>)}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={applyDefaults}>Apply Defaults to Selected Class</Button>
                <Button type="button" variant="outline" onClick={applyDefaultsAll}>Apply Defaults to All Classes</Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-medium">What this does</h2>
          <p className="mt-2 text-sm text-gray-600">This page uses the existing subject defaults endpoint to populate missing subjects for classes without duplicating existing entries.</p>
        </Card>
      </div>
    </div>
  )
}
