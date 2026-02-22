"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import notificationsService from '@/services/notificationsService'

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

function fmtDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await notificationsService.listRequests({ status: status || undefined, limit: 100 })
      setRequests(Array.isArray(res?.requests) ? res.requests : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Principal can review and reply to user requests."
        right={(
          <Button onClick={load} disabled={loading}>
            Refresh
          </Button>
        )}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        <h2 className="font-medium">Requests</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </Select>
          <div className="sm:col-span-2 text-sm text-gray-600 flex items-center">
            Filter affects the requests table only.
          </div>
        </div>
        <div className="mt-3 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : requests.length === 0 ? (
            <div className="text-sm text-gray-600">No requests.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">From</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Updated</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 border rounded ${statusBadgeClass(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 border rounded ${badgeClass(r.category)}`}>{r.category}</span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{r?.requester?.name || 'â€”'} ({r?.requester?.role || 'â€”'})</td>
                    <td className="py-2 pr-3">{r.title}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.updatedAt || r.createdAt)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <Link className="px-3 py-1 border rounded hover-theme-primary" href={`/principal/notifications/requests/${r._id}`}>Open</Link>
                    </td>
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


