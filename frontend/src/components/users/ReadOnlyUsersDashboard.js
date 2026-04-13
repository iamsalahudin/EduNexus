"use client"

import { useEffect, useMemo, useState } from 'react'
import directoryService from '@/services/directoryService'
import {
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from '@/components/ui'

const ROLE_OPTIONS = ['', 'Principal', 'Finance', 'HR', 'Reception', 'Teacher', 'Student', 'Parent']

export default function ReadOnlyUsersDashboard({ title, subtitle }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])

  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [active, setActive] = useState('')

  useEffect(() => {
    let mounted = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await directoryService.listUsers({
          q: query.trim() || undefined,
          role: role || undefined,
          active: active || undefined,
          excludeRoles: 'Admin',
          limit: 300,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        })

        if (mounted) setUsers(data?.users || [])
      } catch (e) {
        if (mounted) setError(e?.response?.data?.error || e?.message || 'Failed to load users')
      } finally {
        if (mounted) setLoading(false)
      }
    }, 250)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [query, role, active])

  const stats = useMemo(() => {
    const total = users.length
    const activeCount = users.filter((u) => u.active !== false).length
    const inactive = total - activeCount
    return { total, activeCount, inactive }
  }, [users])

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={loading ? '...' : stats.total} />
        <StatCard label="Active Users" value={loading ? '...' : stats.activeCount} />
        <StatCard label="Inactive Users" value={loading ? '...' : stats.inactive} />
      </div>

      {error ? <div className="text-red-500 text-sm">{error}</div> : null}

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

        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-40" />
          ) : users.length === 0 ? (
            <EmptyState title="No matching users" />
          ) : (
            <Table>
              <TableRoot>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Email</TableHeader>
                    <TableHeader>Role</TableHeader>
                    <TableHeader>Active</TableHeader>
                    <TableHeader>Updated</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id || u.id} className="hover:bg-gray-50">
                      <TableCell>{u.name || '-'}</TableCell>
                      <TableCell>{u.email || '-'}</TableCell>
                      <TableCell>{u.role || '-'}</TableCell>
                      <TableCell>{u.active === false ? 'No' : 'Yes'}</TableCell>
                      <TableCell>{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
