"use client"

import { useEffect, useState } from 'react'
import { Button, Card, PageHeader, Skeleton } from '@/components/ui'
import ToggleBox from '@/components/ui/ToggleBox'
import notificationsService from '@/services/notificationsService'

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState({ push: true, email: true, sms: false })
  const [inbox, setInbox] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadInbox() {
    setLoading(true)
    setError('')
    try {
      const res = await notificationsService.inbox({ limit: 25 })
      const notifications = Array.isArray(res?.notifications) ? res.notifications : []
      const requests = Array.isArray(res?.requests) ? res.requests : []
      const merged = [
        ...notifications.map((item) => ({ ...item, kind: 'broadcast' })),
        ...requests.map((item) => ({ ...item, kind: 'request' }))
      ]
      merged.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      setInbox(merged)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load notification inbox')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadPreferences() {
      try {
        // Try to load from backend first
        const res = await notificationsService.getPreferences()
        if (res?.preferences) {
          setPrefs(res.preferences)
        } else {
          // Fall back to localStorage
          const raw = localStorage.getItem('edunexus-notification-prefs')
          if (raw) setPrefs(JSON.parse(raw))
        }
      } catch {
        // Fall back to localStorage on error
        try {
          const raw = localStorage.getItem('edunexus-notification-prefs')
          if (raw) setPrefs(JSON.parse(raw))
        } catch {}
      }
    }
    loadPreferences()
  }, [])

  useEffect(() => {
    async function savePreferences() {
      try {
        // Save to backend
        await notificationsService.updatePreferences(prefs)
      } catch {
        // Silently fail, but keep localStorage as fallback
      }
      // Always keep localStorage in sync
      try {
        localStorage.setItem('edunexus-notification-prefs', JSON.stringify(prefs))
      } catch {}
    }
    savePreferences()
  }, [prefs])

  useEffect(() => {
    loadInbox()
  }, [])

  async function markRead(id) {
    setActioningId(id)
    setError('')
    setSuccess('')
    try {
      await notificationsService.markRead(id)
      setSuccess('Marked as read')
      await loadInbox()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to mark notification as read')
    } finally {
      setActioningId('')
    }
  }

  async function dismiss(id) {
    setActioningId(id)
    setError('')
    setSuccess('')
    try {
      await notificationsService.dismiss(id)
      setSuccess('Notification dismissed')
      await loadInbox()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to dismiss notification')
    } finally {
      setActioningId('')
    }
  }

  const unreadCount = inbox.filter((item) => !item.isRead).length

  return (
    <div className="space-y-6">
      <PageHeader title="Notification Settings" subtitle="Local preferences and live inbox actions" />

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="space-y-3 max-w-xl">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
            <p className="mt-1 text-sm text-slate-600">Stored locally in this browser.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ToggleBox active={prefs.push} onToggle={(next) => setPrefs((current) => ({ ...current, push: next }))}>Push notifications</ToggleBox>
            <ToggleBox active={prefs.email} onToggle={(next) => setPrefs((current) => ({ ...current, email: next }))}>Email notifications</ToggleBox>
            <ToggleBox active={prefs.sms} onToggle={(next) => setPrefs((current) => ({ ...current, sms: next }))}>SMS notifications</ToggleBox>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Live inbox</h2>
              <p className="mt-1 text-sm text-slate-600">Use the backend inbox, mark read, and dismiss flows.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Unread: {unreadCount}</div>
          </div>

          {loading ? (
            <Skeleton className="h-64" />
          ) : inbox.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No notifications available in the inbox.</div>
          ) : (
            <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
              {inbox.map((item) => (
                <div
                  key={item._id}
                  className={`rounded-2xl border p-4 shadow-sm ${item.isRead ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">{item.kind}</p>
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{item.body || item.thread?.[0]?.message || 'No message provided.'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.category || 'info'}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.isRead ? 'Read' : 'Unread'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {!item.isRead ? (
                      <Button type="button" size="sm" onClick={() => markRead(item._id)} disabled={actioningId === item._id}>
                        {actioningId === item._id ? 'Working...' : 'Mark read'}
                      </Button>
                    ) : null}
                    {item.kind === 'broadcast' ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => dismiss(item._id)} disabled={actioningId === item._id}>
                        {actioningId === item._id ? 'Working...' : 'Dismiss'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}