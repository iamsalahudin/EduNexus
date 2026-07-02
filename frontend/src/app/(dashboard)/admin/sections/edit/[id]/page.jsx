'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, Input, PageHeader, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'

export default function EditSectionPage({ params }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const classId = String(params?.id || '')
  const sectionName = useMemo(() => String(searchParams.get('section') || '').trim(), [searchParams])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [classRow, setClassRow] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nextName, setNextName] = useState('')

  async function loadClass() {
    setLoading(true)
    setError('')
    try {
      if (!classId || !sectionName) {
        setError('Invalid section edit link')
        return
      }

      const res = await classesService.listClasses({ active: true })
      const rows = Array.isArray(res?.classes) ? res.classes : []
      const found = rows.find((item) => String(item._id) === classId)
      if (!found) {
        setError('Class not found')
        return
      }

      const existing = Array.isArray(found.sections) ? found.sections.map((item) => String(item).trim()) : []
      if (!existing.some((item) => item.toLowerCase() === sectionName.toLowerCase())) {
        setError('Section not found in this class')
        return
      }

      setClassRow(found)
      setNextName(sectionName)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load section')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClass()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, sectionName])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (!classRow) {
        setError('Class not found')
        return
      }

      const current = Array.isArray(classRow.sections) ? classRow.sections : []
      const trimmed = String(nextName || '').trim()
      if (!trimmed) {
        setError('Section name is required')
        return
      }

      const duplicate = current.some((item) => {
        const normalized = String(item).trim().toLowerCase()
        return normalized === trimmed.toLowerCase() && normalized !== sectionName.toLowerCase()
      })
      if (duplicate) {
        setError('A section with this name already exists in this class')
        return
      }

      const updatedSections = current.map((item) => {
        const text = String(item).trim()
        return text.toLowerCase() === sectionName.toLowerCase() ? trimmed : text
      })

      await classesService.updateClass(classId, { sections: updatedSections })
      setSuccess('Section updated')
      router.push('/admin/sections')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update section')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Section" subtitle="Rename a class section" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card className="max-w-2xl p-6">
        {loading ? (
          <Skeleton className="h-36" />
        ) : classRow ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-sm text-gray-600">Class: {classRow.name}</div>
            <Input value={nextName} onChange={(e) => setNextName(e.target.value)} placeholder="Section name" required />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/sections')}>Back</Button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-gray-600">Section not found.</div>
        )}
      </Card>
    </div>
  )
}
