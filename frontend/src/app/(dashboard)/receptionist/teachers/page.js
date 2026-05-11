<<<<<<< HEAD
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, PageHeader, Card, StatCard, Skeleton, EmptyState } from '@/components/ui'
import teacherService from '@/services/teacher.service'

const PAGE_SIZE = 12

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, working: 0, active: 0, inactive: 0, past: 0 })
  const [teachers, setTeachers] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasPrev: false, hasNext: false })

  const stats = useMemo(() => ({
    total: summary?.total || 0,
    working: summary?.working || 0,
    active: summary?.active || 0,
    inactive: summary?.inactive || 0,
    past: summary?.past || 0,
  }), [summary])

  async function loadDashboard(nextPage = 1) {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, listRes] = await Promise.all([
        teacherService.getSummary(),
        teacherService.listTeachers({
          q: q || undefined,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          page: nextPage,
          limit: PAGE_SIZE,
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
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function applyFilters() {
    await loadDashboard(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle="View teacher directory and profiles."
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={loading ? '...' : stats.total} />
        <StatCard label="Working" value={loading ? '...' : stats.working} />
        <StatCard label="Active" value={loading ? '...' : stats.active} />
        <StatCard label="Inactive" value={loading ? '...' : stats.inactive} />
        <StatCard label="Past" value={loading ? '...' : stats.past} />
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card>
        <div>
          <h2 className="font-medium">Teachers Directory</h2>
          <p className="text-sm text-gray-600 mt-1">Search teachers by name or ID</p>
        </div>

        <div className="mt-4 flex gap-2">
          <Input placeholder="Search by name or ID" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
          <button onClick={applyFilters} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-40" />
          ) : teachers.length === 0 ? (
            <EmptyState title="No teachers found" />
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Username</th>
                    <th className="py-2 px-3">Employee ID</th>
                    <th className="py-2 px-3">Designation</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((row) => (
                    <tr key={row._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{row?.user?.name || '-'}</td>
                      <td className="py-2 px-3">{row?.user?.username || '-'}</td>
                      <td className="py-2 px-3">{row.employeeId || '-'}</td>
                      <td className="py-2 px-3">{row.designation || '-'}</td>
                      <td className="py-2 px-3">{row.department || '-'}</td>
                      <td className="py-2 px-3">{row.status || '-'}</td>
                      <td className="py-2 px-3">
                        <a href={`/receptionist/teachers/profile/${row._id}`} className="text-blue-600 hover:underline">View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
=======
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, PageHeader, Card, StatCard, Skeleton, EmptyState } from '@/components/ui'
import teacherService from '@/services/teacher.service'

const PAGE_SIZE = 12

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, working: 0, active: 0, inactive: 0, past: 0 })
  const [teachers, setTeachers] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasPrev: false, hasNext: false })

  const stats = useMemo(() => ({
    total: summary?.total || 0,
    working: summary?.working || 0,
    active: summary?.active || 0,
    inactive: summary?.inactive || 0,
    past: summary?.past || 0,
  }), [summary])

  async function loadDashboard(nextPage = 1) {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, listRes] = await Promise.all([
        teacherService.getSummary(),
        teacherService.listTeachers({
          q: q || undefined,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          page: nextPage,
          limit: PAGE_SIZE,
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
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function applyFilters() {
    await loadDashboard(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle="View teacher directory and profiles."
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={loading ? '...' : stats.total} />
        <StatCard label="Working" value={loading ? '...' : stats.working} />
        <StatCard label="Active" value={loading ? '...' : stats.active} />
        <StatCard label="Inactive" value={loading ? '...' : stats.inactive} />
        <StatCard label="Past" value={loading ? '...' : stats.past} />
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card>
        <div>
          <h2 className="font-medium">Teachers Directory</h2>
          <p className="text-sm text-gray-600 mt-1">Search teachers by name or ID</p>
        </div>

        <div className="mt-4 flex gap-2">
          <Input placeholder="Search by name or ID" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
          <button onClick={applyFilters} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-40" />
          ) : teachers.length === 0 ? (
            <EmptyState title="No teachers found" />
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Username</th>
                    <th className="py-2 px-3">Employee ID</th>
                    <th className="py-2 px-3">Designation</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((row) => (
                    <tr key={row._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{row?.user?.name || '-'}</td>
                      <td className="py-2 px-3">{row?.user?.username || '-'}</td>
                      <td className="py-2 px-3">{row.employeeId || '-'}</td>
                      <td className="py-2 px-3">{row.designation || '-'}</td>
                      <td className="py-2 px-3">{row.department || '-'}</td>
                      <td className="py-2 px-3">{row.status || '-'}</td>
                      <td className="py-2 px-3">
                        <a href={`/receptionist/teachers/profile/${row._id}`} className="text-blue-600 hover:underline">View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
