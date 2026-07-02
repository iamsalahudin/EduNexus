'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, PageHeader, Select, Skeleton } from '@/components/ui'
import notificationsService from '@/services/notificationsService'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function NotificationHistoryPage() {
  const [broadcasts, setBroadcasts] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scope, setScope] = useState('all')
  const [category, setCategory] = useState('all')

  const filters = useMemo(() => ({
    scope: scope === 'all' ? undefined : scope,
    category: category === 'all' ? undefined : category
  }), [scope, category])

  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const [broadcastRes, requestRes] = await Promise.all([
        notificationsService.listBroadcast({ limit: 100, ...filters }),
        notificationsService.listRequests({ limit: 100 })
      ])
      setBroadcasts(Array.isArray(broadcastRes?.notifications) ? broadcastRes.notifications : [])
      setRequests(Array.isArray(requestRes?.requests) ? requestRes.requests : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load notification history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [filters.scope, filters.category])

  const timeline = useMemo(() => {
    const items = [
      ...broadcasts.map((item) => ({ ...item, kind: 'broadcast' })),
      ...requests.map((item) => ({ ...item, kind: 'request' }))
    ]
    return items.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
  }, [broadcasts, requests])

  return (
    <div className="space-y-6">
      <PageHeader title="Notification History" subtitle="Review sent broadcasts and incoming requests in one place" />

      <div className="grid gap-3 md:grid-cols-3">
        <Select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">All scopes</option>
          <option value="global">Global</option>
          <option value="role">Role</option>
          <option value="targeted">Targeted</option>
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          <option value="info">Info</option>
          <option value="normal">Normal</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="system">System</option>
        </Select>
        <button type="button" onClick={loadHistory} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Refresh
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Broadcast history</h2>
            <p className="text-sm text-slate-500">Outgoing notifications with attachments and targeting data.</p>
          </div>

          {loading ? (
            <Skeleton className="h-64" />
          ) : broadcasts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No broadcasts found.</div>
          ) : (
            <div className="space-y-3 max-h-[34rem] overflow-auto pr-1">
              {broadcasts.map((item) => (
                <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Broadcast</p>
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{item.scope || 'global'}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.body || 'No body provided.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{item.category || 'info'}</span>
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

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Requests</h2>
            <p className="text-sm text-slate-500">Incoming request threads and their current state.</p>
          </div>

          {loading ? (
            <Skeleton className="h-64" />
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No requests found.</div>
          ) : (
            <div className="space-y-3 max-h-[34rem] overflow-auto pr-1">
              {requests.map((item) => (
                <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Request</p>
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{item.status || 'pending'}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.thread?.[0]?.message || 'No message provided.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{item.category || 'pending'}</span>
                    <span>{formatDate(item.updatedAt || item.createdAt)}</span>
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

      {timeline.length ? (
        <Card className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Combined timeline</h2>
            <p className="text-sm text-slate-500">Latest activity across broadcasts and requests.</p>
          </div>
          <div className="space-y-3">
            {timeline.slice(0, 10).map((item) => (
              <div key={`${item.kind}-${item._id}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm">
                <div>
                  <span className="mr-2 rounded-full bg-slate-100 px-2 py-1 text-xs uppercase text-slate-600">{item.kind}</span>
                  <span className="font-medium text-slate-900">{item.title}</span>
                </div>
                <span className="text-slate-500">{formatDate(item.updatedAt || item.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
