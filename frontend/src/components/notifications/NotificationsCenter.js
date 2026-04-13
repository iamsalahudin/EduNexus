"use client"

import { useEffect, useMemo, useState } from 'react'
import notificationsService from '@/services/notificationsService'
import { Button, Card, Input, PageHeader, Skeleton, Textarea } from '@/components/ui'

function fmtDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function badgeClass(category) {
  if (category === 'critical') return 'border-red-300 text-red-800 bg-red-50'
  if (category === 'warning') return 'border-yellow-300 text-yellow-800 bg-yellow-50'
  if (category === 'pending') return 'border-yellow-300 text-yellow-800 bg-yellow-50'
  if (category === 'reminder') return 'border-blue-300 text-blue-800 bg-blue-50'
  if (category === 'info') return 'border-blue-300 text-blue-800 bg-blue-50'
  if (category === 'success') return 'border-green-300 text-green-800 bg-green-50'
  return 'border-gray-300 text-gray-800 bg-gray-50'
}

function accentClass(category) {
  if (category === 'critical') return 'border-l-red-400'
  if (category === 'warning') return 'border-l-yellow-400'
  if (category === 'pending') return 'border-l-yellow-400'
  if (category === 'reminder') return 'border-l-blue-400'
  if (category === 'info') return 'border-l-blue-400'
  if (category === 'success') return 'border-l-green-400'
  return 'border-l-gray-300'
}

function statusBadgeClass(status) {
  if (status === 'pending') return 'border-yellow-300 text-yellow-800 bg-yellow-50'
  if (status === 'replied') return 'border-blue-300 text-blue-800 bg-blue-50'
  if (status === 'closed') return 'border-gray-300 text-gray-700 bg-gray-50'
  return 'border-gray-300 text-gray-700 bg-gray-50'
}

export default function NotificationsCenter({ heading = 'Notifications', subheading = 'Read announcements and send requests.' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [requests, setRequests] = useState([])

  const [newTitle, setNewTitle] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [creating, setCreating] = useState(false)

  const [activeRequestId, setActiveRequestId] = useState('')
  const [activeRequest, setActiveRequest] = useState(null)
  const [threadLoading, setThreadLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await notificationsService.inbox({ limit: 50 })
      setItems(Array.isArray(res?.notifications) ? res.notifications : [])
      setRequests(Array.isArray(res?.requests) ? res.requests : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function createRequest() {
    setCreating(true)
    setError('')
    try {
      await notificationsService.createRequest({ title: newTitle, message: newMessage, category: 'pending' })
      setNewTitle('')
      setNewMessage('')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create request')
    } finally {
      setCreating(false)
    }
  }

  async function openRequest(id) {
    if (!id) return
    setActiveRequestId(String(id))
    setThreadLoading(true)
    setError('')
    try {
      const res = await notificationsService.getRequest(id)
      setActiveRequest(res?.request || null)
      if (res?.request?._id) {
        await notificationsService.markRead(res.request._id)
      }
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load request')
      setActiveRequest(null)
    } finally {
      setThreadLoading(false)
    }
  }

  async function markRead(id) {
    if (!id) return
    try {
      await notificationsService.markRead(id)
      await load()
    } catch {
      // ignore
    }
  }

  async function dismiss(id) {
    if (!id) return
    try {
      await notificationsService.dismiss(id)
      await load()
    } catch {
      // ignore
    }
  }

  const sortedNotifs = useMemo(() => {
    const list = Array.isArray(items) ? [...items] : []
    list.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
    return list
  }, [items])

  const sortedRequests = useMemo(() => {
    const list = Array.isArray(requests) ? [...requests] : []
    list.sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0))
    return list
  }, [requests])

  return (
    <div>
      <PageHeader
        title={heading}
        subtitle={subheading}
        actions={
          <Button type="button" onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        <h2 className="font-medium">New Request</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <div className="text-sm text-gray-600 flex items-center">Goes to Admin/Principal</div>
        </div>
        <Textarea
          textareaClassName="min-h-[110px]"
          className="mt-3"
          placeholder="Describe your request…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <div className="mt-3">
          <Button
            variant="primary"
            type="button"
            onClick={createRequest}
            disabled={creating || !newTitle.trim() || !newMessage.trim()}
          >
            {creating ? 'Sending…' : 'Send Request'}
          </Button>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-medium">Inbox</h2>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-40" />
            ) : sortedNotifs.length === 0 ? (
              <div className="text-sm text-gray-600">No notifications yet.</div>
            ) : (
              <div className="space-y-2">
                {sortedNotifs.map((n) => (
                  <div key={n._id} className={`border rounded p-3 border-l-4 ${accentClass(n.category)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{n.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{fmtDateTime(n.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 border rounded ${badgeClass(n.category)}`}>{n.category}</span>
                        {!n.isRead ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => markRead(n._id)}>
                            Mark read
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500">Read</span>
                        )}
                        <Button type="button" size="sm" variant="outline" onClick={() => dismiss(n._id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                    {n.body ? <div className="mt-2 text-sm whitespace-pre-wrap">{n.body}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-medium">My Requests</h2>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-40" />
            ) : sortedRequests.length === 0 ? (
              <div className="text-sm text-gray-600">No requests yet.</div>
            ) : (
              <div className="space-y-2">
                {sortedRequests.map((r) => (
                  <button
                    type="button"
                    key={r._id}
                    onClick={() => openRequest(r._id)}
                    className={`w-full text-left border rounded p-3 hover-theme-primary ${String(activeRequestId) === String(r._id) ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-gray-600 mt-1">Updated: {fmtDateTime(r.updatedAt || r.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 border rounded ${badgeClass(r.category)}`}>{r.category}</span>
                        <span className={`text-xs px-2 py-1 border rounded ${statusBadgeClass(r.status)}`}>{r.status}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium">Request Thread</h3>
            {threadLoading ? (
              <div className="mt-3"><Skeleton className="h-24" /></div>
            ) : !activeRequest ? (
              <div className="mt-3 text-sm text-gray-600">Select a request to view messages.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {(activeRequest.thread || []).map((m, idx) => (
                  <div key={idx} className="border rounded p-3">
                    <div className="text-xs text-gray-600">
                      {m.byRole || 'User'} • {fmtDateTime(m.createdAt)}
                    </div>
                    <div className="mt-1 text-sm whitespace-pre-wrap">{m.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

