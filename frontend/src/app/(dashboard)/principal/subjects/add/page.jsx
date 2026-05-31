'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'

export default function AddSubjectPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({ className: '', name: '', active: true })

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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await subjectsService.createSubject(formData)
      setSuccess('Subject created')
      setFormData({ className: '', name: '', active: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create subject')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Subject" subtitle="Create a new subject for a class" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 p-6">
          {loading ? <Skeleton className="h-40" /> : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select value={formData.className} onChange={(e) => setFormData({ ...formData, className: e.target.value })} required>
                <option value="">Select class</option>
                {classes.map((cls) => <option key={cls._id} value={cls.name}>{cls.name}</option>)}
              </Select>
              <Input placeholder="Subject name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} /> Active</label>
              <Button type="submit" variant="primary">Create Subject</Button>
            </form>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-medium">Notes</h2>
          <p className="mt-2 text-sm text-gray-600">Subjects are unique per class. Existing defaults can be applied from the main Subjects page.</p>
        </Card>
      </div>
    </div>
  )
}
