"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { userService } from '@/services/user.service'
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
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

export default function UsersHome() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [recentUsers, setRecentUsers] = useState([])

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const [allUsersData, recentUsersData] = await Promise.all([
        userService.listUsers({ limit: 500, sortBy: 'createdAt', sortOrder: 'desc' }),
        userService.listUsers({ recentHours: 24, limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
      ])

      setUsers(allUsersData?.users || [])
      setRecentUsers(recentUsersData?.users || [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.active !== false).length
    const inactive = total - active
    return { total, active, inactive }
  }, [users])

  const roleRows = useMemo(() => {
    const roleCount = (users || []).reduce((acc, user) => {
      const key = user?.role || 'Unassigned'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return Object.entries(roleCount)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role))
  }, [users])

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management Dashboard"
        subtitle="Monitor user status, review role distribution, and manage accounts quickly."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={loading ? '...' : stats.total} />
        <StatCard label="Active Users" value={loading ? '...' : stats.active} />
        <StatCard label="Inactive Users" value={loading ? '...' : stats.inactive} />
      </div>

      {error ? <div className="text-red-500 text-sm">{error}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Roles and User Counts</h2>
            <Button type="button" onClick={loadUsers} disabled={loading}>
              Refresh
            </Button>
          </div>

          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-40" />
            ) : roleRows.length === 0 ? (
              <EmptyState title="No users found" />
            ) : (
              <Table>
                <TableRoot>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Roles</TableHeader>
                      <TableHeader>No of Users</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roleRows.map((row) => (
                      <TableRow key={row.role} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/users/search?role=${encodeURIComponent(row.role)}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {row.role}
                          </Link>
                        </TableCell>
                        <TableCell>{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableRoot>
              </Table>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Quick Navigation</h2>
          <p className="mt-1 text-sm text-gray-600">Open the required flow directly.</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
            <ButtonLink href="/admin/users/add" variant="secondary" className="w-full">
              Add New User
            </ButtonLink>
            <ButtonLink href="/admin/users/search" variant="secondary" className="w-full">
              Search Users
            </ButtonLink>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-medium">Recent Users (Last 24 Hours)</h3>
            <p className="mt-1 text-xs text-gray-600">Shows latest 5 users added or updated in the last 24 hours.</p>

            <div className="mt-3">
              {loading ? (
                <Skeleton className="h-36" />
              ) : recentUsers.length === 0 ? (
                <EmptyState title="No users changed in last 24 hours" />
              ) : (
                <Table>
                  <TableRoot>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Username</TableHeader>
                        <TableHeader>Actions</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentUsers.map((u) => {
                        const userId = u._id || u.id
                        return (
                          <TableRow key={userId} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{u.name || '-'}</TableCell>
                            <TableCell>{u.username || '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <ButtonLink href={`/admin/users/user/${userId}`} variant="outline" size="sm">
                                  View
                                </ButtonLink>
                                <ButtonLink
                                  href={`/admin/users/update?id=${encodeURIComponent(userId)}`}
                                  variant="outline"
                                  size="sm"
                                >
                                  Edit
                                </ButtonLink>
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
          </div>
        </Card>
      </div>
    </div>
  )
}

