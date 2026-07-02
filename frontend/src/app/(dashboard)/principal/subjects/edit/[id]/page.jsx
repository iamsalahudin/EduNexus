'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import subjectsService from '@/services/subjectsService'

export default function EditSubjectPage({ params }) {
  const id = useMemo(() => String(params?.id || ''), [params])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [subject, setSubject] = useState(null)
  const [formData, setFormData] = useState({ name: '', active: true })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await subjectsService.listSubjects({})
      const found = Array.isArray(res?.subjects) ? res.subjects.find((item) => String(item._id) === id) : null
      setSubject(found || null)
      setFormData(found ? { name: found.name || '', active: found.active !== false } : { name: '', active: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load subject')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await subjectsService.updateSubject(id, formData)
      setSuccess('Subject updated')
      await load()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update subject')
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this subject?')) return
    try {
      await subjectsService.deleteSubject(id)
      setSuccess('Subject deleted')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete subject')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Subject" subtitle="Update subject details" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card className="max-w-2xl p-6">
        {loading ? <Skeleton className="h-40" /> : subject ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-sm text-gray-600">Class: {subject.className}</div>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Subject name" required />
            <Select value={String(formData.active)} onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <div className="flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={handleDelete}>Delete</Button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-gray-600">Subject not found.</div>
        )}
      </Card>
    </div>
  )
}
