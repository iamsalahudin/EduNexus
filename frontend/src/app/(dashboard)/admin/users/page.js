"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import SubHeader from '@/components/layout/SubHeader'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { userService } from '@/services/user.service'

export default function UsersHome() {
  const breadcrumb = useMemo(
    () => [{ id: 1, name: 'Users', link: '/admin/users' }],
    []
  )

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
      <SubHeader breadcrumb={breadcrumb} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-gray-600 mt-1">Admin-only user management.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users/search" className="px-3 py-2 border rounded hover-theme-primary">Search</Link>
          <Link href="/admin/users/create" className="px-3 py-2 btn-primary rounded">Create</Link>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {loading ? '...' : users.length}</div>
          <button className="px-3 py-2 border rounded hover-theme-primary" onClick={loadUsers} disabled={loading}>
            Refresh
          </button>
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
                        <Link
                          href={`/admin/users/user/${u._id || u.id}`}
                          className="px-2 py-1 border rounded hover-theme-primary"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/users/update?id=${encodeURIComponent(u._id || u.id)}`}
                          className="px-2 py-1 border rounded hover-theme-primary"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
