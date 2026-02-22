"use client"

import { useEffect, useMemo, useState } from 'react'
import { userService } from '@/services/user.service'
import { ButtonLink, Card, EmptyState, Input, PageHeader, Select, Skeleton } from '@/components/ui'

const ROLE_OPTIONS = ['', 'Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'HR', 'Finance', 'Reception']

export default function SearchUsers() {
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
      <PageHeader title="Search Users" subtitle="Filter users by name, email, role, and status." />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email..."
          />

          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r || 'all'} value={r}>
                {r ? r : 'All'}
              </option>
            ))}
          </Select>

          <Select label="Active" value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
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
                        <ButtonLink href={`/admin/users/user/${u._id || u.id}`} variant="outline" size="sm">
                          View
                        </ButtonLink>
                        <ButtonLink href={`/admin/users/update?id=${encodeURIComponent(u._id || u.id)}`} variant="outline" size="sm">
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
