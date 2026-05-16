"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import dailyDiaryService from '@/services/dailyDiaryService'
import { DIARY_STATUS, DIARY_STATUS_DISPLAY, DIARY_STATUS_OPTIONS, getStatusColor } from '@/utils/constants'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

function statusBadge(status) {
  return getStatusColor(status, 'diary')
}

export default function DailyDiaryWorkspace({
  title = 'Daily Diary',
  subtitle = 'Class and subject based daily diary',
  canCreate = false,
  canEdit = false,
  readOnly = false
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [query, setQuery] = useState({ class: '', section: '', date: '', q: '' })
  const [appliedQuery, setAppliedQuery] = useState({ class: '', section: '', date: '', q: '' })
  const [form, setForm] = useState({ date: '', class: '', section: '', subject: '', title: '', content: '', status: DIARY_STATUS.PUBLISHED })
  const [editingId, setEditingId] = useState('')
  const [formSubjects, setFormSubjects] = useState([])

  const selectedClass = useMemo(() => classes.find((c) => String(c?.name) === String(form.class)) || null, [classes, form.class])
  const sections = useMemo(() => (Array.isArray(selectedClass?.sections) ? selectedClass.sections : []), [selectedClass])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (appliedQuery.class) params.class = appliedQuery.class
      if (appliedQuery.section) params.section = appliedQuery.section
      if (appliedQuery.date) params.date = appliedQuery.date
      if (appliedQuery.q) params.q = appliedQuery.q

      const [diaryRes, classRes] = await Promise.all([
        dailyDiaryService.list(params),
        classesService.listClasses({ active: true })
      ])

      setRows(Array.isArray(diaryRes?.diaries) ? diaryRes.diaries : [])
      setClasses(Array.isArray(classRes?.classes) ? classRes.classes : [])
      // subjects will be loaded per selected class when creating an entry
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load daily diary')
    } finally {
      setLoading(false)
    }
  }

  async function loadSubjectsForClass(className) {
    if (!className) return setSubjects([])
    try {
      const res = await subjectsService.listSubjects({ className, active: true })
      const subs = Array.isArray(res?.subjects) ? res.subjects : []
      setSubjects(subs)
      // initialize form subject rows for quick multi-entry creation
      setFormSubjects(subs.map((s) => ({ subject: s._id, title: '', content: '', status: form.status || DIARY_STATUS.PUBLISHED })))
    } catch (e) {
      setSubjects([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery])

  useEffect(() => {
    if (form.class && sections.length && form.section && !sections.includes(form.section)) {
      setForm((prev) => ({ ...prev, section: '' }))
    }
  }, [form.class, form.section, sections])

  useEffect(() => {
    // When the add/edit form's class changes, load subjects assigned to that class
    if (form.class) loadSubjectsForClass(form.class)
    else setSubjects([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.class])

  useEffect(() => {
    // when subjects change and we are not editing a single entry, reset formSubjects
    if (!editingId && Array.isArray(subjects) && subjects.length) {
      setFormSubjects(subjects.map((s) => ({ subject: s._id, title: '', content: '', status: form.status || DIARY_STATUS.PUBLISHED })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects])

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (editingId) {
        const payload = {
          date: form.date,
          class: form.class,
          section: form.section,
          subject: form.subject,
          title: form.title,
          content: form.content,
          status: form.status
        }
        await dailyDiaryService.update(editingId, payload)
        setMessage('Daily diary updated successfully.')
      } else {
        // If formSubjects present, create entries for each subject row that has content/title
        if (Array.isArray(formSubjects) && formSubjects.length) {
          const toCreate = formSubjects.filter((s) => (s.title && s.title.trim()) || (s.content && s.content.trim()))
          if (toCreate.length === 0) throw new Error('Please provide title or content for at least one subject row.')
          await Promise.all(toCreate.map((s) => dailyDiaryService.create({
            date: form.date,
            class: form.class,
            section: form.section,
            subject: s.subject,
            title: s.title,
            content: s.content,
            status: s.status || form.status
          })))
          setMessage(`Created ${toCreate.length} diary entr${toCreate.length === 1 ? 'y' : 'ies'}.`)
        } else {
          const payload = {
            date: form.date,
            class: form.class,
            section: form.section,
            subject: form.subject,
            title: form.title,
            content: form.content,
            status: form.status
          }
          await dailyDiaryService.create(payload)
          setMessage('Daily diary created successfully.')
        }
      }

      setForm({ date: '', class: '', section: '', subject: '', title: '', content: '', status: DIARY_STATUS.PUBLISHED })
      setFormSubjects([])
      setEditingId('')
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to save daily diary')
    } finally {
      setSaving(false)
    }
  }

  function onEdit(row) {
    if (!canEdit) return
    setEditingId(row.id)
    setForm({
      date: fmtDate(row.date),
      class: row.class || '',
      section: row.section || '',
      subject: row.subject?.id || '',
      title: row.title || '',
      content: row.content || '',
      status: row.status || DIARY_STATUS.PUBLISHED
    })
    setMessage('Editing selected diary entry.')
  }

  async function onDelete(id) {
    if (readOnly) return
    const ok = window.confirm('Delete this daily diary entry?')
    if (!ok) return
    try {
      setError('')
      setMessage('')
      await dailyDiaryService.remove(id)
      setMessage('Daily diary deleted.')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete daily diary')
    }
  }

  const summary = useMemo(() => {
    const stats = { total: rows.length, published: 0, draft: 0 }
    rows.forEach((row) => {
      const key = String(row.status || '')
      if (key === DIARY_STATUS.PUBLISHED) stats.published += 1
      else if (key === DIARY_STATUS.DRAFT) stats.draft += 1
    })
    return stats
  }, [rows])

  const sortedRows = useMemo(() => {
    const list = [...rows]
    return list.sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
  }, [rows])

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} right={<Button onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>} />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {message ? <div className="mt-4 text-sm text-green-600">{message}</div> : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="text-sm text-gray-600">Total Entries</div><div className="text-xl font-semibold mt-1">{summary.total}</div></Card>
        <Card><div className="text-sm text-gray-600">Published</div><div className="text-xl font-semibold mt-1">{summary.published}</div></Card>
        <Card><div className="text-sm text-gray-600">Draft</div><div className="text-xl font-semibold mt-1">{summary.draft}</div></Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-medium">Filters</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input type="date" value={query.date} onChange={(e) => setQuery((prev) => ({ ...prev, date: e.target.value }))} />
          <Input value={query.class} onChange={(e) => setQuery((prev) => ({ ...prev, class: e.target.value }))} placeholder="Class" />
          <Input value={query.section} onChange={(e) => setQuery((prev) => ({ ...prev, section: e.target.value }))} placeholder="Section" />
          <Input value={query.q} onChange={(e) => setQuery((prev) => ({ ...prev, q: e.target.value }))} placeholder="Search title/content" />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => setAppliedQuery({ ...query })} disabled={loading}>Apply Filters</Button>
          <Button
            variant="outline"
            onClick={() => {
              const reset = { class: '', section: '', date: '', q: '' }
              setQuery(reset)
              setAppliedQuery(reset)
            }}
            disabled={loading}
          >
            Clear
          </Button>
        </div>
      </Card>

      {canCreate ? (
        <Card className="mt-6">
          <h2 className="font-medium">{editingId ? 'Edit Daily Diary' : 'Add Daily Diary'}</h2>
          <form className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={onSave}>
            <Input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} required />
            <Select value={form.class} onChange={(e) => setForm((prev) => ({ ...prev, class: e.target.value }))} required>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
            </Select>
            <Select value={form.section} onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value }))} required>
              <option value="">Select section</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            {Array.isArray(subjects) && subjects.length > 0 ? (
              <div className="md:col-span-3 space-y-3">
                {subjects.map((s, idx) => {
                  const row = formSubjects[idx] || { subject: s._id, title: '', content: '', status: form.status }
                  return (
                    <div key={s._id} className="border rounded p-3">
                      <div className="font-medium">{s.name}</div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input value={row.title} onChange={(e) => {
                          const copy = [...formSubjects]
                          copy[idx] = { ...(copy[idx] || { subject: s._id, title: '', content: '', status: form.status }), title: e.target.value }
                          setFormSubjects(copy)
                        }} placeholder="Entry title" />
                        <Select value={row.status || form.status} onChange={(e) => {
                          const copy = [...formSubjects]
                          copy[idx] = { ...(copy[idx] || { subject: s._id, title: '', content: '', status: form.status }), status: e.target.value }
                          setFormSubjects(copy)
                        }}>
                          {DIARY_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                        <div className="hidden md:block" />
                        <div className="md:col-span-3">
                          <Textarea rows={3} value={row.content} onChange={(e) => {
                            const copy = [...formSubjects]
                            copy[idx] = { ...(copy[idx] || { subject: s._id, title: '', content: '', status: form.status }), content: e.target.value }
                            setFormSubjects(copy)
                          }} placeholder="Details (optional)" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Select value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} required>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </Select>
            )}
            <Select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              {DIARY_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Select>
            <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Diary title" required />
            <div className="md:col-span-3">
              <Textarea rows={4} value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} placeholder="Write daily diary details" />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update Diary' : 'Create Diary'}</Button>
              {editingId ? <Button type="button" variant="outline" onClick={() => { setEditingId(''); setForm({ date: '', class: '', section: '', subject: '', title: '', content: '', status: DIARY_STATUS.PUBLISHED }) }}>Cancel Edit</Button> : null}
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="mt-6">
        <h2 className="font-medium">Daily Diary Records</h2>
        <div className="mt-3 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : sortedRows.length === 0 ? (
            <div className="text-sm text-gray-600">No diary records found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Teacher</th>
                  <th className="py-2 pr-3">Status</th>
                  {(canEdit || !readOnly) ? <th className="py-2 pr-3">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(row.date)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.class}-{row.section}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.subject?.name || '—'}</td>
                    <td className="py-2 pr-3">{row.title}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.teacher?.name || '—'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap"><span className={statusBadge(row.status)}>{row.status}</span></td>
                    {(canEdit || !readOnly) ? (
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {canEdit ? <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Edit</Button> : null}
                        {!readOnly ? <Button size="sm" className="ml-2" onClick={() => onDelete(row.id)}>Delete</Button> : null}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
