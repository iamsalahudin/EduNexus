"use client"

import { useEffect, useMemo, useState } from 'react'
import ButtonLink from '@/components/ui/ButtonLink'
import teacherService from '@/services/teacher.service'
import {
  Button,
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

const STATUS_OPTIONS = ['', 'Working', 'Resigned']
const ACTIVE_OPTIONS = ['', 'true', 'false']
const PAGE_SIZE = 12

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [summary, setSummary] = useState({ total: 0, working: 0, active: 0, inactive: 0, past: 0 })
  const [teachers, setTeachers] = useState([])
  const [recentTeachers, setRecentTeachers] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [active, setActive] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  })
  const [error, setError] = useState('')

  const stats = useMemo(() => ({
    total: summary?.total || 0,
    working: summary?.working || 0,
    active: summary?.active || 0,
    inactive: summary?.inactive || 0,
    past: summary?.past || 0,
  }), [summary])

  async function loadDashboard(nextPage = 1, opts = {}) {
    const silent = Boolean(opts.silent)
    if (silent) {
      setLoading(true)
    } else {
      setBootstrapping(true)
    }
    setError('')
    try {
      const [summaryRes, listRes, recentRes] = await Promise.all([
        teacherService.getSummary(),
        teacherService.listTeachers({
          q: q || undefined,
          status: status || undefined,
          active: active || undefined,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          page: nextPage,
          limit: PAGE_SIZE,
        }),
        teacherService.listTeachers({
          recentHours: 24,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          limit: 5,
        }),
      ])

      setSummary(summaryRes?.summary || {})
      setTeachers(Array.isArray(listRes?.teachers) ? listRes.teachers : [])
      setPagination(listRes?.pagination || {
        page: nextPage,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      })
      setPage(listRes?.pagination?.page || nextPage)
      setRecentTeachers(Array.isArray(recentRes?.teachers) ? recentRes.teachers : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teachers')
    } finally {
      if (silent) setLoading(false)
      else setBootstrapping(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function applyFilters() {
    await loadDashboard(1, { silent: true })
  }

  async function goToPage(nextPage) {
    if (nextPage < 1) return
    await loadDashboard(nextPage, { silent: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle="Track teacher accounts, profiles, and recent onboarding activity."
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={bootstrapping ? '...' : stats.total} />
        <StatCard label="Working" value={bootstrapping ? '...' : stats.working} />
        <StatCard label="Active" value={bootstrapping ? '...' : stats.active} />
        <StatCard label="Inactive" value={bootstrapping ? '...' : stats.inactive} />
        <StatCard label="Past" value={bootstrapping ? '...' : stats.past} />
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Teachers List</h2>
              <p className="text-sm text-gray-600 mt-1">Search by name, email, designation, department, or employee ID.</p>
            </div>
            <Button type="button" onClick={() => loadDashboard(page, { silent: true })} disabled={bootstrapping || loading}>Refresh</Button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s || 'all'} value={s}>{s || 'Any Status'}</option>
              ))}
            </Select>
            <Select value={active} onChange={(e) => setActive(e.target.value)}>
              {ACTIVE_OPTIONS.map((a) => (
                <option key={a || 'all'} value={a}>
                  {a === '' ? 'Any Active State' : a === 'true' ? 'Active' : 'Inactive'}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-3">
            <Button type="button" variant="primary" onClick={applyFilters} disabled={bootstrapping || loading}>
              {loading ? 'Searching...' : 'Apply Filters'}
            </Button>
          </div>

          <div className="mt-4">
            {bootstrapping ? (
              <Skeleton className="h-40" />
            ) : teachers.length === 0 ? (
              <EmptyState title="No teachers found" />
            ) : (
              <>
                <Table>
                  <TableRoot>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Employee ID</TableHeader>
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Username</TableHeader>
                        <TableHeader>Designation</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader>Actions</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teachers.map((row) => (
                        <TableRow key={row._id} className="hover:bg-gray-50">
                          <TableCell>{row.employeeId || '-'}</TableCell>
                          <TableCell>{row?.user?.name || '-'}</TableCell>
                          <TableCell>{row?.user?.username || '-'}</TableCell>
                          <TableCell>{row.designation || '-'}</TableCell>
                          <TableCell>{row.status || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <ButtonLink href={`/principal/teachers/profile/${row._id}`} variant="outline" size="sm">View</ButtonLink>
                              <ButtonLink href={`/principal/teachers/edit/${row._id}`} variant="outline" size="sm">Edit</ButtonLink>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableRoot>
                </Table>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages} | Total {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={!pagination.hasPrev || loading}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={!pagination.hasNext || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-medium">Quick Navigation</h2>
          <p className="text-sm text-gray-600 mt-1">Manage teacher records and onboarding.</p>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <ButtonLink href="/principal/teachers/add" variant="secondary" className="w-full">Add New Teacher</ButtonLink>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-medium">Recent Teachers (Last 24 Hours)</h3>
            <p className="text-xs text-gray-600 mt-1">Latest 5 teacher profiles added or updated.</p>

            <div className="mt-3">
              {bootstrapping ? (
                <Skeleton className="h-28" />
              ) : recentTeachers.length === 0 ? (
                <EmptyState title="No recent teacher updates" />
              ) : (
                <Table>
                  <TableRoot>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Actions</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTeachers.map((row) => (
                        <TableRow key={row._id}>
                          <TableCell>{row?.user?.name || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <ButtonLink href={`/principal/teachers/profile/${row._id}`} variant="outline" size="sm">View</ButtonLink>
                              <ButtonLink href={`/principal/teachers/edit/${row._id}`} variant="outline" size="sm">Edit</ButtonLink>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
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


