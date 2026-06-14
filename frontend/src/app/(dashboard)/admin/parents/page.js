"use client"

import { useEffect, useMemo, useState } from 'react'
import ButtonLink from '@/components/ui/ButtonLink'
import parentService from '@/services/parents.services'
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

const PAGE_SIZE = 12

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [summary, setSummary] = useState({ total: 0, working: 0, active: 0, inactive: 0, past: 0 })
  const [parents, setParents] = useState([])
  const [recentParents, setRecentParents] = useState([])
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
      const [listRes, recentRes] = await Promise.all([
        parentService.listParents({
          q: q || undefined,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          page: nextPage,
          limit: PAGE_SIZE,
        }),
        parentService.listParents({
          recentHours: 24,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          limit: 5,
        }),
      ])

      setParents(Array.isArray(listRes?.parents) ? listRes.parents : [])
      setPagination(listRes?.pagination || {
        page: nextPage,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      })
      setPage(listRes?.pagination?.page || nextPage)
      setRecentParents(Array.isArray(recentRes?.parents) ? recentRes.parents : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load parents data')
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
        title="Parents"
        subtitle="Track parent accounts, profiles, and recent onboarding activity."
      />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Parents List</h2>
              <p className="text-sm text-gray-600 mt-1">Search by name, email or parent ID.</p>
            </div>
            <Button type="button" onClick={() => loadDashboard(page, { silent: true })} disabled={bootstrapping || loading}>Refresh</Button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="mt-3">
            <Button type="button" variant="primary" onClick={applyFilters} disabled={bootstrapping || loading}>
              {loading ? 'Searching...' : 'Apply Filters'}
            </Button>
          </div>

          <div className="mt-4">
            {bootstrapping ? (
              <Skeleton className="h-40" />
            ) : parents.length === 0 ? (
              <EmptyState title="No parents found" />
            ) : (
              <>
                <Table>
                  <TableRoot>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Parent ID</TableHeader>
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Email</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader>Actions</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parents.map((row) => (
                        <TableRow key={row._id} className="hover:bg-gray-50">
                          <TableCell>{row.parentId || '-'}</TableCell>
                          <TableCell>{row?.user?.name || '-'}</TableCell>
                          <TableCell>{row.email || '-'}</TableCell>
                          <TableCell>{row.status || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <ButtonLink href={`/admin/parents/profile/${row._id}`} variant="outline" size="sm">View</ButtonLink>
                              <ButtonLink href={`/admin/parents/edit/${row._id}`} variant="outline" size="sm">Edit</ButtonLink>
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
          <p className="text-sm text-gray-600 mt-1">Manage parent records and onboarding.</p>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <ButtonLink href="/admin/parents/add" variant="secondary" className="w-full">Add New Parent</ButtonLink>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-medium">Recent Parents (Last 24 Hours)</h3>
            <p className="text-xs text-gray-600 mt-1">Latest 5 parent profiles added or updated.</p>

            <div className="mt-3">
              {bootstrapping ? (
                <Skeleton className="h-28" />
              ) : recentParents.length === 0 ? (
                <EmptyState title="No recent parent updates" />
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
                      {recentParents.map((row) => (
                        <TableRow key={row._id}>
                          <TableCell>{row?.user?.name || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <ButtonLink href={`/admin/parents/profile/${row._id}`} variant="outline" size="sm">View</ButtonLink>
                              <ButtonLink href={`/admin/parents/edit/${row._id}`} variant="outline" size="sm">Edit</ButtonLink>
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
