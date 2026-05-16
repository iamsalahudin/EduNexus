'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'
import notificationsService from '@/services/notificationsService'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('info')
  const [scope, setScope] = useState('global')
  const [expiresAt, setExpiresAt] = useState('')
  const [attachments, setAttachments] = useState([])

  async function loadAnnouncements() {
    setLoading(true)
    setError('')
    try {
      const res = await notificationsService.listBroadcast({ category: category === 'all' ? undefined : category, scope: scope === 'all' ? undefined : scope, limit: 50 })
      setItems(Array.isArray(res?.notifications) ? res.notifications : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [category, scope])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const formData = new FormData()
      formData.append('scope', 'global')
      formData.append('category', category === 'all' ? 'info' : category)
      formData.append('title', title)
      formData.append('body', body)
      if (expiresAt) formData.append('expiresAt', expiresAt)
      attachments.forEach((file) => formData.append('attachments', file))
      await notificationsService.createBroadcast(formData)
      setTitle('')
      setBody('')
      setExpiresAt('')
      setAttachments([])
      setSuccess('Announcement published')
      loadAnnouncements()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to publish announcement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Publish school-wide notices with files and expiry controls" />

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Compose announcement</h2>
            <p className="text-sm text-slate-500">Visible to the school community as a global notice.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="info">Info</option>
                <option value="normal">Normal</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </Select>
              <Select value={scope} onChange={(e) => setScope(e.target.value)} disabled>
                <option value="global">Global</option>
              </Select>
            </div>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea rows={5} placeholder="Announcement body" value={body} onChange={(e) => setBody(e.target.value)} required />
            <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            <Input type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files || []))} />

            {attachments.length ? (
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {attachments.map((file) => (
                  <span key={`${file.name}-${file.lastModified}`} className="rounded-full bg-slate-100 px-3 py-1">
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>{saving ? 'Publishing...' : 'Publish announcement'}</Button>
              <Button type="button" variant="secondary" onClick={loadAnnouncements}>Refresh</Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Announcement feed</h2>
              <p className="text-sm text-slate-500">Recent items and attached files.</p>
            </div>
            <div className="flex gap-2">
              <Select value={scope} onChange={(e) => setScope(e.target.value)} className="min-w-32">
                <option value="all">All scopes</option>
                <option value="global">Global</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-64" />
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No announcements yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[34rem] overflow-auto pr-1">
              {items.map((item) => (
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
                    <span>{formatDate(item.createdAt)}</span>
                    {Array.isArray(item.attachments) && item.attachments.length ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{item.attachments.length} attachment(s)</span>
                    ) : null}
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
