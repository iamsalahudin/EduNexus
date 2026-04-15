"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { userService } from '@/services/user.service'
import {
  ButtonLink,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from '@/components/ui'

const ROLE_OPTIONS = ['', 'Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'HR', 'Finance', 'Reception']

export default function SearchUsers() {
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])

  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [active, setActive] = useState('') // '', 'true', 'false'

  useEffect(() => {
    const roleFromQuery = (searchParams?.get('role') || '').trim()
    if (ROLE_OPTIONS.includes(roleFromQuery)) {
      setRole(roleFromQuery)
    }
  }, [searchParams])

  useEffect(() => {
    let mounted = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await userService.listUsers({
          q: query.trim() || undefined,
          role: role || undefined,
          active: active || undefined,
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Search Users"
        subtitle="Filter users by name, email, role, and status."
        right={
          <ButtonLink href="/admin/users/add" variant="primary">
            Add User
          </ButtonLink>
        }
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, username or email..."
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
                    <TableHeader>Username</TableHeader>
                    <TableHeader>Email</TableHeader>
                    <TableHeader>Role</TableHeader>
                    <TableHeader>Active</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => {
                    const userId = u._id || u.id
                    return (
                      <TableRow key={userId} className="hover:bg-gray-50">
                        <TableCell>{u.name || '-'}</TableCell>
                        <TableCell>{u.username || '-'}</TableCell>
                        <TableCell>{u.email || '-'}</TableCell>
                        <TableCell>{u.role || '-'}</TableCell>
                        <TableCell>{u.active === false ? 'No' : 'Yes'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <ButtonLink href={`/admin/users/user/${userId}`} variant="outline" size="sm">
                              View
                            </ButtonLink>
                            {u.role !== 'Admin' ? (
                              <ButtonLink href={`/admin/users/update?id=${encodeURIComponent(userId)}`} variant="outline" size="sm">
                                Edit
                              </ButtonLink>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </TableRoot>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
