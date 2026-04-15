"use client"

import { useEffect, useMemo, useState } from 'react'
import reportCardsService from '@/services/reportCardsService'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'

function yearOptions() {
  const y = new Date().getFullYear()
  return [y + 1, y, y - 1, y - 2, y - 3]
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [reportCards, setReportCards] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [term, setTerm] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [status, setStatus] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [yearsToKeep, setYearsToKeep] = useState('3')
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const params = {
        ...(term ? { term } : {}),
        ...(year ? { year: Number(year) } : {}),
        ...(status ? { status } : {}),
        ...(includeArchived ? { includeArchived: 'true' } : {}),
      }
      const { reportCards: list } = await reportCardsService.listReportCards(params)
      setReportCards(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load report cards')
    } finally {
      setLoading(false)
    }
  }

  async function runArchive() {
    const keepYears = Math.max(1, Number(yearsToKeep) || 3)
    if (!window.confirm(`Archive published report cards older than ${keepYears} years?`)) return

    setArchiveBusy(true)
    setError('')
    setSuccess('')
    try {
      const result = await reportCardsService.runArchive(keepYears)
      setSuccess(`Archived ${result?.archivedCount || 0} report cards (cutoff year: ${result?.cutoffYear || '-'})`)
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to run archival')
    } finally {
      setArchiveBusy(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const cls = String(classFilter || '').trim().toLowerCase()
    const sec = String(sectionFilter || '').trim().toLowerCase()
    return (Array.isArray(reportCards) ? reportCards : []).filter((rc) => {
      if (cls) {
        const studentClass = String(rc?.student?.class || '').toLowerCase()
        if (!studentClass.includes(cls)) return false
      }
      if (sec) {
        const studentSection = String(rc?.student?.section || '').toLowerCase()
        if (!studentSection.includes(sec)) return false
      }
      return true
    })
  }, [reportCards, classFilter, sectionFilter])

  async function approve(rc) {
    if (!rc?._id) return
    setError('')
    setSuccess('')
    try {
      await reportCardsService.approve(rc._id)
      setSuccess('Approved & published')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to approve')
    }
  }

  async function reject(rc) {
    if (!rc?._id) return
    const remarks = window.prompt('Rejection remarks (optional):', '')
    if (remarks === null) return

    setError('')
    setSuccess('')
    try {
      await reportCardsService.reject(rc._id, remarks)
      setSuccess('Rejected (sent back to draft)')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to reject')
    }
  }

  return (
    <div>
      <PageHeader
        title="Report Cards"
        subtitle="Review, approve, and publish report cards submitted by teachers."
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <Card className="mt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">Filters</h2>
            <p className="text-sm text-gray-600 mt-1">Term/year/status are server filters. Class/section filter is local.</p>
          </div>
          <Button type="button" onClick={load} disabled={loading}>Refresh</Button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input placeholder="Term (e.g., Mid, Final, Monthly-Jan)" value={term} onChange={(e) => setTerm(e.target.value)} />
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            {yearOptions().map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option value="draft">Draft (pending)</option>
            <option value="published">Published</option>
          </Select>
          <Input placeholder="Class (contains)" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} />
          <Input placeholder="Section (contains)" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={includeArchived ? 'true' : 'false'} onChange={(e) => setIncludeArchived(e.target.value === 'true')}>
            <option value="false">Active records only</option>
            <option value="true">Include archived records</option>
          </Select>
          <Input
            type="number"
            min="1"
            placeholder="Years to keep (default 3)"
            value={yearsToKeep}
            onChange={(e) => setYearsToKeep(e.target.value)}
          />
          <Button type="button" onClick={runArchive} disabled={loading || archiveBusy}>
            {archiveBusy ? 'Archiving...' : 'Run Archive'}
          </Button>
        </div>

        <div className="mt-4">
          <Button variant="primary" type="button" onClick={load} disabled={loading}>Apply</Button>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Report Cards</h2>
          <div className="text-sm text-gray-600">{filtered.length} shown</div>
        </div>

        {loading ? (
          <div className="mt-4"><Skeleton className="h-24" /></div>
        ) : filtered.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">No report cards found.</div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Section</th>
                  <th className="py-2 pr-3">Term</th>
                  <th className="py-2 pr-3">Year</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Archived</th>
                  <th className="py-2 pr-3">%age</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rc) => (
                  <tr key={rc?._id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {rc?.student?.firstName} {rc?.student?.lastName}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{rc?.student?.class || '-'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{rc?.student?.section || '-'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{rc?.term}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{rc?.year}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{rc?.status}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{rc?.archived ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {typeof rc?.percentage === 'number' ? rc.percentage.toFixed(1) : '-'}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => approve(rc)}
                          disabled={rc?.status === 'published'}
                        >
                          Approve
                        </Button>
                        <Button type="button" onClick={() => reject(rc)}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
