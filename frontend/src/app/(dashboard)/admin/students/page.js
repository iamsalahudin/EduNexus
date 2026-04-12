"use client"

import { useEffect, useMemo, useState } from 'react'
import ButtonLink from '@/components/ui/ButtonLink'
import studentsService from '@/services/studentsService'
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

const STATUS_OPTIONS = ['', 'incampus', 'alumni']
const ACTIVE_OPTIONS = ['', 'true', 'false']
const PAGE_SIZE = 12

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [summary, setSummary] = useState({ total: 0, incampus: 0, active: 0, alumni: 0 })
  const [students, setStudents] = useState([])
  const [recentStudents, setRecentStudents] = useState([])
  const [recentCertificates, setRecentCertificates] = useState([])
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

  function formatDate(value) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString()
  }

  async function downloadCertificateById(certificateId, certificateNumber) {
    const blob = await studentsService.downloadCertificatePdf(certificateId)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${certificateNumber || 'certificate'}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => ({
    total: summary?.total || 0,
    incampus: summary?.incampus || 0,
    active: summary?.active || 0,
    alumni: summary?.alumni || 0,
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
      const [summaryRes, listRes, recentRes, recentCertificatesRes] = await Promise.all([
        studentsService.getSummary(),
        studentsService.listStudents({
          q: q || undefined,
          status: status || undefined,
          active: active || undefined,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          page: nextPage,
          limit: PAGE_SIZE,
        }),
        studentsService.listStudents({
          recentHours: 24,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          limit: 5,
        }),
        studentsService.listRecentCertificates({ limit: 5 }),
      ])

      setSummary(summaryRes?.summary || {})
      setStudents(Array.isArray(listRes?.students) ? listRes.students : [])
      setPagination(listRes?.pagination || {
        page: nextPage,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      })
      setPage(listRes?.pagination?.page || nextPage)
      setRecentStudents(Array.isArray(recentRes?.students) ? recentRes.students : [])
      setRecentCertificates(Array.isArray(recentCertificatesRes?.certificates) ? recentCertificatesRes.certificates : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load students')
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
        title="Students"
        subtitle="Manage student records, class movement, and certificate workflows."
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Total" value={bootstrapping ? '...' : stats.total} />
            <StatCard label="Incampus" value={bootstrapping ? '...' : stats.incampus} />
            <StatCard label="Active" value={bootstrapping ? '...' : stats.active} />
            <StatCard label="Alumni" value={bootstrapping ? '...' : stats.alumni} />
          </div>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">Student Search</h2>
                <p className="text-sm text-gray-600 mt-1">Find students by ID, registration, roll, name, contact, class, and section.</p>
              </div>
              <Button type="button" onClick={() => loadDashboard(page, { silent: true })} disabled={bootstrapping || loading}>Refresh</Button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
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
              ) : students.length === 0 ? (
                <EmptyState title="No students found" />
              ) : (
                <>
                  <div className="overflow-auto">
                    <Table>
                      <TableRoot>
                        <TableHead>
                          <TableRow>
                            <TableHeader>Student ID</TableHeader>
                            <TableHeader>Reg #</TableHeader>
                            <TableHeader>Name</TableHeader>
                            <TableHeader>Class</TableHeader>
                            <TableHeader>Status</TableHeader>
                            <TableHeader>Actions</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {students.map((row) => (
                            <TableRow key={row._id} className="hover:bg-gray-50">
                              <TableCell>{row.studentId || '-'}</TableCell>
                              <TableCell>{row.registrationNumber || '-'}</TableCell>
                              <TableCell>{row.name || '-'}</TableCell>
                              <TableCell>{[row.class, row.section].filter(Boolean).join(' - ') || '-'}</TableCell>
                              <TableCell className="capitalize">{row.status || '-'}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  <ButtonLink href={`/admin/students/profile/${row._id}`} variant="outline" size="sm">View</ButtonLink>
                                  <ButtonLink href={`/admin/students/edit/${row._id}`} variant="outline" size="sm">Edit</ButtonLink>
                                  <ButtonLink href={`/admin/students/transfer-certificate?studentId=${row._id}`} variant="outline" size="sm">TC</ButtonLink>
                                  <ButtonLink href={`/admin/students/school-leaving-certificate?studentId=${row._id}`} variant="outline" size="sm">SLC</ButtonLink>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </TableRoot>
                    </Table>
                  </div>

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
        </div>

        <Card className="h-full flex flex-col">
          <h2 className="font-medium">Quick Navigation</h2>
          <p className="text-sm text-gray-600 mt-1">Jump to student workflows.</p>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <ButtonLink href="/admin/students/admission" variant="secondary" className="w-full">Student Admission</ButtonLink>
            <ButtonLink href="/admin/students/promotion" variant="secondary" className="w-full">Student Promotion</ButtonLink>
            <ButtonLink href="/admin/students/transfer-certificate" variant="secondary" className="w-full">Transfer Certificate</ButtonLink>
            <ButtonLink href="/admin/students/school-leaving-certificate" variant="secondary" className="w-full">School Leaving Certificate</ButtonLink>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-medium">Recent Students (Last 24 Hours)</h3>
            <p className="text-xs text-gray-600 mt-1">Latest 5 student records added or updated.</p>

            <div className="mt-3">
              {bootstrapping ? (
                <Skeleton className="h-28" />
              ) : recentStudents.length === 0 ? (
                <EmptyState title="No recent student updates" />
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableRoot>
                      <TableHead>
                        <TableRow>
                          <TableHeader>Name</TableHeader>
                          <TableHeader>Actions</TableHeader>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentStudents.map((row) => (
                          <TableRow key={row._id}>
                            <TableCell>{row.name || '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <ButtonLink href={`/admin/students/profile/${row._id}`} variant="outline" size="sm">View</ButtonLink>
                                <ButtonLink href={`/admin/students/edit/${row._id}`} variant="outline" size="sm">Edit</ButtonLink>
                                <ButtonLink href={`/admin/students/transfer-certificate?studentId=${row._id}`} variant="outline" size="sm">TC</ButtonLink>
                                <ButtonLink href={`/admin/students/school-leaving-certificate?studentId=${row._id}`} variant="outline" size="sm">SLC</ButtonLink>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </TableRoot>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-gray-200 pt-5">
            <h3 className="text-sm font-medium">Recent Certificates</h3>
            <p className="text-xs text-gray-600 mt-1">Latest issued transfer and school leaving certificates.</p>

            <div className="mt-3">
              {bootstrapping ? (
                <Skeleton className="h-28" />
              ) : recentCertificates.length === 0 ? (
                <EmptyState title="No recent certificates" />
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableRoot>
                      <TableHead>
                        <TableRow>
                          <TableHeader>Certificate</TableHeader>
                          <TableHeader>Student</TableHeader>
                          <TableHeader>Date</TableHeader>
                          <TableHeader>Action</TableHeader>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentCertificates.map((row) => (
                          <TableRow key={row._id}>
                            <TableCell>{row.certificateNumber || '-'}</TableCell>
                            <TableCell>{row?.student?.user?.name || row?.studentSnapshot?.userName || '-'}</TableCell>
                            <TableCell>{formatDate(row.issueDate)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => downloadCertificateById(row._id, row.certificateNumber)}
                              >
                                PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </TableRoot>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
