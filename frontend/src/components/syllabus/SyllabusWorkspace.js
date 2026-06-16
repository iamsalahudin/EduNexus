'use client'

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import syllabusService from '@/services/syllabusService'
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'

const TERM_OPTIONS = [
  { value: 'annual', label: 'Annual' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'term-1', label: 'Term 1' },
  { value: 'term-2', label: 'Term 2' },
  { value: 'term-3', label: 'Term 3' },
  { value: 'custom', label: 'Custom' }
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' }
]

function splitLines(value) {
  return String(value || '')
    .split(/\r?\n|,/g)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function joinLines(value) {
  return Array.isArray(value) ? value.join('\n') : ''
}

export default function SyllabusWorkspace() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [records, setRecords] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [filters, setFilters] = useState({ q: '', status: '', term: '' })
  const [form, setForm] = useState({
    className: '',
    subjectName: '',
    title: '',
    academicYear: '',
    term: 'annual',
    chaptersText: '',
    status: 'draft',
    notes: ''
  })
  const [editingId, setEditingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadAll(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const [classesRes, syllabusRes] = await Promise.all([
        classesService.listClasses({ active: true }),
        syllabusService.listSyllabus(nextFilters)
      ])

      setClasses(Array.isArray(classesRes?.classes) ? classesRes.classes : [])
      setRecords(Array.isArray(syllabusRes?.syllabus) ? syllabusRes.syllabus : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load syllabus')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedClass) {
      setSubjects([])
      return
    }

    let active = true
    ;(async () => {
      try {
        const res = await subjectsService.listSubjects({ className: selectedClass, active: true })
        if (!active) return
        setSubjects(Array.isArray(res?.subjects) ? res.subjects : [])
      } catch {
        if (active) setSubjects([])
      }
    })()

    return () => {
      active = false
    }
  }, [selectedClass])

  const selectedClassSubjects = useMemo(() => subjects, [subjects])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function resetForm() {
    setEditingId('')
    setForm({
      className: selectedClass || '',
      subjectName: '',
      title: '',
      academicYear: '',
      term: 'annual',
      chaptersText: '',
      status: 'draft',
      notes: ''
    })
  }

  function editRow(row) {
    setEditingId(row._id)
    setSelectedClass(row.className || '')
    setForm({
      className: row.className || '',
      subjectName: row.subjectName || '',
      title: row.title || '',
      academicYear: row.academicYear || '',
      term: row.term || 'annual',
      chaptersText: joinLines(row.chapters),
      status: row.status || 'draft',
      notes: row.notes || ''
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        className: form.className,
        subjectName: form.subjectName,
        title: form.title,
        academicYear: form.academicYear,
        term: form.term,
        chapters: splitLines(form.chaptersText),
        status: form.status,
        notes: form.notes
      }

      if (editingId) {
        await syllabusService.updateSyllabus(editingId, payload)
        setSuccess('Syllabus updated')
      } else {
        await syllabusService.createSyllabus(payload)
        setSuccess('Syllabus created')
      }

      await loadAll()
      resetForm()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to save syllabus')
    } finally {
      setSaving(false)
    }
  }

  async function removeRow(row) {
    const ok = window.confirm(`Delete syllabus "${row.title}"?`)
    if (!ok) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await syllabusService.deleteSyllabus(row._id)
      await loadAll()
      if (editingId === row._id) resetForm()
      setSuccess('Syllabus deleted')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete syllabus')
    } finally {
      setSaving(false)
    }
  }

  async function applyFilters() {
    await loadAll(filters)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Syllabus"
        subtitle="Manage class-wise subject syllabi, chapters, and status."
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Search title or notes" value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} />
          <Select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <Select value={filters.term} onChange={(e) => setFilters((prev) => ({ ...prev, term: e.target.value }))}>
            <option value="">All Terms</option>
            {TERM_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <Button type="button" onClick={applyFilters}>Refresh</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-medium">{editingId ? 'Edit Syllabus' : 'Create Syllabus'}</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <Select value={form.className} onChange={(e) => { setField('className', e.target.value); setSelectedClass(e.target.value); setField('subjectName', ''); }} required>
              <option value="">Select class</option>
              {classes.map((cls) => <option key={cls._id} value={cls.name}>{cls.name}</option>)}
            </Select>

            <Select value={form.subjectName} onChange={(e) => setField('subjectName', e.target.value)} required>
              <option value="">Select subject</option>
              {selectedClassSubjects.map((subject) => <option key={subject._id} value={subject.name}>{subject.name}</option>)}
            </Select>

            <Input placeholder="Syllabus title" value={form.title} onChange={(e) => setField('title', e.target.value)} required />
            <Input placeholder="Academic year" value={form.academicYear} onChange={(e) => setField('academicYear', e.target.value)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select value={form.term} onChange={(e) => setField('term', e.target.value)}>
                {TERM_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              <Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </div>

            <Textarea placeholder="Chapters or topics (one per line)" value={form.chaptersText} onChange={(e) => setField('chaptersText', e.target.value)} rows={4} />
            <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} />

            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="font-medium">Syllabus Records</h2>
          <div className="mt-4 space-y-3">
            {loading ? <Skeleton className="h-52" /> : null}
            {!loading && records.length === 0 ? <div className="text-sm text-gray-600">No syllabus records found.</div> : null}
            {!loading && records.map((row) => (
              <div key={row._id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-sm text-gray-600">{row.className} | {row.subjectName} | {row.term} | {row.status}</div>
                    <div className="text-sm text-gray-600 mt-1">{row.chapters?.length || 0} chapters</div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => editRow(row)}>Edit</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeRow(row)}>Delete</Button>
                  </div>
                </div>
                {row.notes ? <p className="mt-2 text-sm text-slate-700">{row.notes}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}