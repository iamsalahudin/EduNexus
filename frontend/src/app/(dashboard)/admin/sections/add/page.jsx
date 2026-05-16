'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'

export default function AddSectionPage() {
  const router = useRouter()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({ classId: '', sectionName: '' })

  async function loadClasses() {
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
    loadClasses()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const classRow = classes.find((item) => String(item._id) === String(formData.classId))
      if (!classRow) {
        setError('Select a class')
        return
      }

      const sectionName = String(formData.sectionName || '').trim()
      if (!sectionName) {
        setError('Section name is required')
        return
      }

      const existing = Array.isArray(classRow.sections) ? classRow.sections : []
      const duplicate = existing.some((item) => String(item).trim().toLowerCase() === sectionName.toLowerCase())
      if (duplicate) {
        setError('This section already exists in the selected class')
        return
      }

      await classesService.updateClass(classRow._id, { sections: [...existing, sectionName] })
      setSuccess('Section created')
      setFormData({ classId: '', sectionName: '' })
      router.push('/admin/sections')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create section')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Section" subtitle="Create a class section by appending it to an existing class" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card className="max-w-2xl p-6">
        {loading ? (
          <Skeleton className="h-36" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Select value={formData.classId} onChange={(e) => setFormData((current) => ({ ...current, classId: e.target.value }))} required>
                <option value="">Select class</option>
                {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </Select>
              {formData.classId && (
                <div className="mt-3 rounded-xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Existing sections</div>
                  {(() => {
                    const selectedClass = classes.find((item) => String(item._id) === String(formData.classId))
                    const existing = Array.isArray(selectedClass?.sections) ? selectedClass.sections : []
                    return (
                      <div className="mt-2">
                        {existing.length === 0 ? (
                          <p className="text-sm text-slate-600">No sections yet</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {existing.map((section) => (
                              <span key={section} className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                                {section}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
            <Input
              placeholder="Section name (e.g. A, Boys, Girls)"
              value={formData.sectionName}
              onChange={(e) => setFormData((current) => ({ ...current, sectionName: e.target.value }))}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Section'}</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/sections')}>Back</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
