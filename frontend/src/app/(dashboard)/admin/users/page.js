"use client"

import { useEffect, useState } from 'react'
import { userService } from '@/services/user.service'
import { Button, ButtonLink, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui'

export default function UsersHome() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const data = await userService.listUsers()
      setUsers(data?.users || [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        subtitle="Admin-only user management."
        right={
          <div className="flex gap-2">
            <ButtonLink href="/admin/users/search" variant="secondary">
              Search
            </ButtonLink>
            <ButtonLink href="/admin/users/create" variant="primary">
              Create
            </ButtonLink>
          </div>
        }
      />

      <Card>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {loading ? '...' : users.length}</div>
          <Button type="button" onClick={loadUsers} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="mt-3 text-red-500 text-sm">{error}</div>
        ) : null}

        <div className="mt-4 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : users.length === 0 ? (
            <EmptyState title="No users found" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Active</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-3">{u.name || '-'}</td>
                    <td className="py-2 pr-3">{u.email || '-'}</td>
                    <td className="py-2 pr-3">{u.role || '-'}</td>
                    <td className="py-2 pr-3">{u.active === false ? 'No' : 'Yes'}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <ButtonLink href={`/admin/users/user/${u._id || u.id}`} variant="outline" size="sm">
                          View
                        </ButtonLink>
                        <ButtonLink
                          href={`/admin/users/update?id=${encodeURIComponent(u._id || u.id)}`}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </ButtonLink>
                      </div>
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

