"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import SubHeader from '@/components/layout/SubHeader'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { userService } from '@/services/user.service'

const ROLE_OPTIONS = ['', 'Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'HR', 'Finance', 'Reception']

export default function SearchUsers() {
  const breadcrumb = useMemo(
    () => [
      { id: 1, name: 'Users', link: '/admin/users' },
      { id: 2, name: 'Search', link: '/admin/users/search' }
    ],
    []
  )

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])

  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [active, setActive] = useState('') // '', 'true', 'false'

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await userService.listUsers()
        if (mounted) setUsers(data?.users || [])
      } catch (e) {
        if (mounted) setError(e?.response?.data?.error || e?.message || 'Failed to load users')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (users || []).filter((u) => {
      if (role && u.role !== role) return false
      if (active) {
        const isActive = u.active !== false
        if (active === 'true' && !isActive) return false
        if (active === 'false' && isActive) return false
      }
      if (!q) return true
      const hay = `${u.name || ''} ${u.email || ''} ${u.role || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [users, query, role, active])

  return (
    <div className="space-y-4">
      <SubHeader breadcrumb={breadcrumb} />

      <div>
        <h1 className="text-2xl font-semibold">Search Users</h1>
        <p className="text-sm text-gray-600 mt-1">Filter users by name, email, role, and status.</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Search</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email..." className="w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full">
              {ROLE_OPTIONS.map((r) => (
                <option key={r || 'all'} value={r}>
                  {r ? r : 'All'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Active</label>
            <select value={active} onChange={(e) => setActive(e.target.value)} className="w-full">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {error ? <div className="mt-3 text-red-500 text-sm">{error}</div> : null}

        <div className="mt-4 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : filtered.length === 0 ? (
            <EmptyState title="No matching users" />
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
                {filtered.map((u) => (
                  <tr key={u._id || u.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-3">{u.name || '-'}</td>
                    <td className="py-2 pr-3">{u.email || '-'}</td>
                    <td className="py-2 pr-3">{u.role || '-'}</td>
                    <td className="py-2 pr-3">{u.active === false ? 'No' : 'Yes'}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/users/user/${u._id || u.id}`} className="px-2 py-1 border rounded hover-theme-primary">View</Link>
                        <Link href={`/admin/users/update?id=${encodeURIComponent(u._id || u.id)}`} className="px-2 py-1 border rounded hover-theme-primary">Edit</Link>
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
