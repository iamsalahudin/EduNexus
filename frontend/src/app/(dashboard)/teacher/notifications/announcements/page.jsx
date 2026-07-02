'use client'

import { useEffect, useState } from 'react'
import { Button, Card, PageHeader, Skeleton } from '@/components/ui'
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
  const [error, setError] = useState('')

  async function loadAnnouncements() {
    setLoading(true)
    setError('')
    try {
      const res = await notificationsService.inbox({ limit: 50 })
      const all = Array.isArray(res?.notifications) ? res.notifications : []
      setItems(all.filter((n) => n?.kind === 'broadcast'))
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="School announcements shared with you."
        right={<Button type="button" variant="secondary" onClick={loadAnnouncements} disabled={loading}>Refresh</Button>}
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <Skeleton className="h-64" />
      ) : items.length === 0 ? (
        <Card>
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            No announcements yet.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">{item.category || 'info'}</p>
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {!item.isRead ? (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">New</span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{item.scope}</span>
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 whitespace-pre-line">{item.body || 'No body provided.'}</p>
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
    </div>
  )
}
