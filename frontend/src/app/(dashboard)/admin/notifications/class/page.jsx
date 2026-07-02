'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'
import classesService from '@/services/classesService'
import notificationsService from '@/services/notificationsService'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function ClassNotificationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [classes, setClasses] = useState([])
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [recipientRole, setRecipientRole] = useState('Student')
  const [category, setCategory] = useState('info')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState([])
  const [filterClass, setFilterClass] = useState('all')

  const sections = useMemo(() => [...new Set(classes.filter((item) => !filterClass || filterClass === 'all' || item.name === filterClass).map((item) => item.section).filter(Boolean))], [classes, filterClass])

  async function loadClasses() {
    try {
      const res = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(res?.classes) ? res.classes : [])
    } catch (err) {
      console.error(err)
    }
  }

  async function loadItems() {
    setLoading(true)
    try {
      const res = await notificationsService.listBroadcast({ scope: 'targeted', limit: 100 })
      setItems(Array.isArray(res?.notifications) ? res.notifications : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load class notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
    loadItems()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('scope', 'targeted')
      formData.append('targetType', section ? 'section' : 'class')
      formData.append('recipientRoles', recipientRole)
      formData.append('category', category)
      formData.append('title', title)
      formData.append('body', body)
      formData.append('class', className)
      if (section) formData.append('section', section)
      attachments.forEach((file) => formData.append('attachments', file))

      await notificationsService.createBroadcast(formData)
      setTitle('')
      setBody('')
      setCategory('info')
      setAttachments([])
      setSuccess('Class notification sent')
      loadItems()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send class notification')
    } finally {
      setSaving(false)
    }
  }

  const visibleItems = filterClass === 'all'
    ? items
    : items.filter((item) => String(item.targetClass || '') === String(filterClass))

  return (
    <div className="space-y-6">
      <PageHeader title="Class Notifications" subtitle="Target a class or section and attach files when needed" />

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Send to a class</h2>
            <p className="text-sm text-slate-500">Select a class, optionally narrow to a section, and choose the audience.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={className} onChange={(e) => setClassName(e.target.value)} required>
                <option value="">Select class</option>
                {classes.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
              </Select>
              <Select value={recipientRole} onChange={(e) => setRecipientRole(e.target.value)}>
                <option value="Student">Students</option>
                <option value="Parent">Parents</option>
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Select value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="">All sections</option>
                {sections.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="info">Info</option>
                <option value="normal">Normal</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </Select>
            </div>

            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea rows={5} placeholder="Notification body" value={body} onChange={(e) => setBody(e.target.value)} required />
            <Input type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files || []))} />

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>{saving ? 'Sending...' : 'Send class notification'}</Button>
              <Button type="button" variant="secondary" onClick={loadItems}>Refresh</Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent class notifications</h2>
              <p className="text-sm text-slate-500">Track the most recent targeted broadcasts.</p>
            </div>
            <Select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="min-w-36">
              <option value="all">All classes</option>
              {classes.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
            </Select>
          </div>

          {loading ? (
            <Skeleton className="h-64" />
          ) : visibleItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No class notifications yet.</div>
          ) : (
            <div className="space-y-3 max-h-[34rem] overflow-auto pr-1">
              {visibleItems.map((item) => (
                <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">{item.category || 'info'}</p>
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{item.scope}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.body || 'No body provided.'}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{item.targetClass || 'Class'}</span>
                    {item.targetSection ? <span>{item.targetSection}</span> : null}
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  {Array.isArray(item.attachments) && item.attachments.length ? (
                    <div className="mt-3 flex flex-col gap-2">
                      {item.attachments.map((link, index) => (
                        <a key={`${item._id}-${index}`} href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline decoration-blue-200 underline-offset-2">
                          Attachment {index + 1}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
