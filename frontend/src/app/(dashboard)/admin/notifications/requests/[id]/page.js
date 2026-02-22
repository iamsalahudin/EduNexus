"use client"

import { useEffect, useState } from 'react'
import notificationsService from '@/services/notificationsService'
import { Button, ButtonLink, Card, PageHeader, Skeleton, Textarea } from '@/components/ui'

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

function statusBadgeClass(status) {
  if (status === 'pending') return 'border-yellow-300 text-yellow-800 bg-yellow-50'
  if (status === 'replied') return 'border-blue-300 text-blue-800 bg-blue-50'
  if (status === 'closed') return 'border-gray-300 text-gray-700 bg-gray-50'
  return 'border-gray-300 text-gray-700 bg-gray-50'
}

export default function Page({ params }) {
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [request, setRequest] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const isClosed = request?.status === 'closed'

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await notificationsService.getRequest(id)
      setRequest(res?.request || null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load request')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function reply() {
    setSending(true)
    setError('')
    try {
      const res = await notificationsService.replyRequest(id, { message })
      setRequest(res?.request || null)
      setMessage('')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to reply')
    } finally {
      setSending(false)
    }
  }

  async function close() {
    setSending(true)
    setError('')
    try {
      const res = await notificationsService.closeRequest(id)
      setRequest(res?.request || null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to close request')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Request"
        subtitle="Reply as Admin."
        right={<ButtonLink href="/admin/notifications" variant="secondary">Back</ButtonLink>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      {loading ? (
        <div className="mt-6"><Skeleton className="h-40" /></div>
      ) : !request ? (
        <div className="mt-6 text-sm text-gray-600">Not found.</div>
      ) : (
        <>
          <Card className="mt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-600">From</div>
                <div className="mt-1 font-medium">{request?.requester?.name || '—'} ({request?.requester?.role || '—'})</div>
                <div className="text-sm text-gray-600 mt-3">Title</div>
                <div className="mt-1 font-medium">{request.title}</div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 border rounded ${statusBadgeClass(request.status)}`}>{request.status}</span>
                  <span className={`text-xs px-2 py-1 border rounded ${badgeClass(request.category)}`}>{request.category}</span>
                </div>
                <div className="mt-1">Updated: <span className="font-medium">{fmtDateTime(request.updatedAt || request.createdAt)}</span></div>
              </div>
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="font-medium">Thread</h2>
            <div className="mt-3 space-y-2">
              {(request.thread || []).map((m, idx) => (
                <div key={idx} className="border rounded p-3">
                  <div className="text-xs text-gray-600">
                    {m?.byRole || 'User'} • {fmtDateTime(m.createdAt)}
                  </div>
                  <div className="mt-1 text-sm whitespace-pre-wrap">{m.message}</div>
                </div>
              ))}
              {request.thread?.length ? null : <div className="text-sm text-gray-600">No messages.</div>}
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="font-medium">Reply</h2>
            <Textarea
              className="mt-3"
              textareaClassName="min-h-[110px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your reply…"
            />
            <div className="mt-3 flex gap-2">
              <Button variant="primary" onClick={reply} disabled={sending || isClosed || !message.trim()}>
                {sending ? 'Sending…' : 'Send Reply'}
              </Button>
              <Button onClick={close} disabled={sending || isClosed}>
                Close Request
              </Button>
              <Button onClick={load} disabled={sending}>
                Refresh
              </Button>
            </div>
            {isClosed ? <div className="mt-2 text-sm text-gray-600">This request is closed.</div> : null}
          </Card>
        </>
      )}
    </div>
  )
}

