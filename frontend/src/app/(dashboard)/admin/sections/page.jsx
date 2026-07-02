'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'

export default function SectionsPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')

  async function loadClasses() {
    setLoading(true)
    setError('')
    try {
      const res = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(res?.classes) ? res.classes : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load sections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  const rows = useMemo(() => {
    return classes.flatMap((item) => {
      const sectionRows = Array.isArray(item.sections) ? item.sections : []
      return sectionRows.map((sectionName) => ({
        classId: item._id,
        className: item.name,
        sectionName: String(sectionName || '').trim()
      }))
    }).filter((row) => {
      if (!row.sectionName) return false
      if (classFilter && row.classId !== classFilter) return false
      if (!query) return true
      const needle = query.toLowerCase()
      return row.className.toLowerCase().includes(needle) || row.sectionName.toLowerCase().includes(needle)
    })
  }, [classes, classFilter, query])

  const summary = useMemo(() => {
    const classCount = classes.length
    const sectionCount = classes.reduce((total, item) => total + (Array.isArray(item.sections) ? item.sections.length : 0), 0)
    const filteredCount = rows.length
    return { classCount, sectionCount, filteredCount }
  }, [classes, rows])

  async function removeSection(classId, sectionName) {
    if (!window.confirm(`Remove section \"${sectionName}\"?`)) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const classRow = classes.find((item) => String(item._id) === String(classId))
      if (!classRow) throw new Error('Class not found')
      const nextSections = (Array.isArray(classRow.sections) ? classRow.sections : []).filter((item) => String(item) !== String(sectionName))
      await classesService.updateClass(classId, { sections: nextSections })
      setSuccess('Section removed')
      await loadClasses()
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to remove section')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        subtitle="Manage class sections and keep section lists aligned to active classes."
        right={<ButtonLink href="/admin/sections/add" variant="primary">Add Section</ButtonLink>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-600">Active Classes</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{summary.classCount}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Total Sections</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{summary.sectionCount}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Visible Rows</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{summary.filteredCount}</div>
        </Card>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search by class or section"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All classes</option>
            {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Button type="button" onClick={loadClasses} disabled={loading || saving}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <Skeleton className="h-40" />
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600">
            No sections found for the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 text-left">Class</th>
                  <th className="py-2 px-3 text-left">Section</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.classId}-${row.sectionName}`} className="border-b">
                    <td className="py-2 px-3">{row.className}</td>
                    <td className="py-2 px-3">{row.sectionName}</td>
                    <td className="py-2 px-3">
                      <div className="flex justify-end gap-2">
                        <ButtonLink href={`/admin/sections/edit/${row.classId}?section=${encodeURIComponent(row.sectionName)}`} variant="outline" size="sm">Edit</ButtonLink>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeSection(row.classId, row.sectionName)} disabled={saving}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
