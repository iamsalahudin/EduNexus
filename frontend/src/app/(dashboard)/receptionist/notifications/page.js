'use client'

import { useEffect, useState } from 'react'
import { PageHeader, Card, Skeleton, EmptyState } from '@/components/ui'
import notificationService from '@/services/notification.service'

const PAGE_SIZE = 15

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, unread, read
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasPrev: false, hasNext: false })
  const [error, setError] = useState('')

  async function loadNotifications(nextPage = 1) {
    setLoading(true)
    setError('')
    try {
      const res = await notificationService.listNotifications({
        status: filter === 'unread' ? 'unread' : filter === 'read' ? 'read' : undefined,
        page: nextPage,
        limit: PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setNotifications(Array.isArray(res?.notifications) ? res.notifications : [])
      setPagination(res?.pagination || {
        page: nextPage,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      })
      setPage(nextPage)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function markAsRead(id) {
    try {
      await notificationService.markAsRead(id)
      await loadNotifications(page)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to mark as read')
    }
  }

  async function markAllAsRead() {
    try {
      await notificationService.markAllAsRead()
      await loadNotifications(1)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to mark all as read')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="View your system notifications and alerts."
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-medium">Notifications</h2>
            <p className="text-sm text-gray-600 mt-1">Stay updated with system messages</p>
          </div>
          <button onClick={markAllAsRead} className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-dark" disabled={loading || notifications.length === 0}>
            Mark all as read
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {['all', 'unread', 'read'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-sm rounded ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {loading ? (
            <Skeleton className="h-40" />
          ) : notifications.length === 0 ? (
            <EmptyState title="No notifications" />
          ) : (
            notifications.map((notif) => (
              <div key={notif._id} className={`p-3 rounded border ${!notif.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{notif.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                  {!notif.read && (
                    <button onClick={() => markAsRead(notif._id)} className="ml-2 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark">
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => loadNotifications(page - 1)} disabled={!pagination.hasPrev} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <span className="px-3 py-1 text-sm">Page {page} of {pagination.totalPages}</span>
            <button onClick={() => loadNotifications(page + 1)} disabled={!pagination.hasNext} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
