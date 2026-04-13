"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import timetableService from '@/services/timetableService'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toISOString().slice(0, 10)
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function trimText(value) {
  return String(value || '').trim()
}

function slotStart(slot) {
  return String(slot?.startTime || '').trim()
}

function entityText(value) {
  if (!value) return '—'
  if (typeof value === 'string') return trimText(value) || '—'
  return trimText(value?.name || value?.label || value?.username || value?._id || value?.id) || '—'
}

export default function TimetableOverviewPanel({ roleBase = '/admin', canCreate = true }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  const [yearFilter, setYearFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await timetableService.listTimetables({})
      const timetables = Array.isArray(res?.timetables) ? res.timetables : []
      setRows(timetables)
    } catch (e) {
      setError(e?.response?.data?.error || 'Unable to load timetables.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  async function handleArchive(id) {
    if (!window.confirm('Archive this timetable? It will be marked inactive and removed from active use.')) return
    try {
      await timetableService.updateTimetable(id, { status: 'archived' })
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: 'archived', isActive: false } : r)))
    } catch (e) {
      alert(e?.response?.data?.error || 'Unable to archive timetable.')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this archived timetable permanently? This action cannot be undone.')) return
    try {
      await timetableService.deleteTimetable(id)
      setRows((prev) => prev.filter((r) => r._id !== id))
    } catch (e) {
      alert(e?.response?.data?.error || 'Unable to delete timetable.')
    }
  }

  async function handleClone(row) {
    try {
      // Create new timetable with same structure but different year
      const newYear = (parseInt(row.year) || new Date().getFullYear()) + 1
      const newTimetable = {
        level: row.level,
        year: newYear,
        slots: JSON.parse(JSON.stringify(row.slots || [])),
      }
      const res = await timetableService.createTimetable(newTimetable)
      // Reload and navigate to edit
      await load()
      window.location.href = `${roleBase}/timetable/edit/${res?.timetable?._id}`
    } catch (e) {
      alert(e?.response?.data?.error || 'Unable to duplicate timetable.')
    }
  }

  async function exportRowPDF(row) {
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default

      const pdf = new jsPDF('landscape', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 24
      const lineHeight = 16
      const maxTextWidth = pageWidth - margin * 2

      let y = margin
      pdf.setFontSize(14)
      pdf.text(`Timetable Export: ${trimText(row?.level) || 'Level'} ${trimText(row?.year) ? `(${trimText(row.year)})` : ''}`, margin, y)
      y += 20

      pdf.setFontSize(10)
      const slots = (Array.isArray(row?.slots) ? row.slots : []).slice().sort((a, b) => {
        const dayDelta = DAY_ORDER.indexOf(trimText(a?.day)) - DAY_ORDER.indexOf(trimText(b?.day))
        if (dayDelta !== 0) return dayDelta
        return slotStart(a).localeCompare(slotStart(b))
      })

      if (!slots.length) {
        pdf.text('No timetable slots found.', margin, y)
      } else {
        slots.forEach((slot) => {
          const line = [
            trimText(slot?.day) || '—',
            `${trimText(slot?.startTime) || '—'}-${trimText(slot?.endTime) || '—'}`,
            `${trimText(slot?.class) || '—'}${trimText(slot?.section) ? ` (${trimText(slot.section)})` : ''}`,
            `Subject: ${entityText(slot?.subject)}`,
            `Teacher: ${entityText(slot?.teacher)}`,
            `Room: ${trimText(slot?.room) || '—'}`,
          ].join(' | ')

          const wrapped = pdf.splitTextToSize(line, maxTextWidth)
          if (y + wrapped.length * lineHeight > pageHeight - margin) {
            pdf.addPage()
            y = margin
          }
          wrapped.forEach((textLine) => {
            pdf.text(textLine, margin, y)
            y += lineHeight
          })
        })
      }

      const fileName = `timetable-${trimText(row?.level || 'all')}-${trimText(row?.year || '') || 'year'}.pdf`
      pdf.save(fileName)
    } catch (e) {
      alert('PDF export failed. Please try again.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const years = useMemo(() => {
    return [...new Set(rows.map((row) => String(row?.year || '')).filter(Boolean))].sort((a, b) => Number(b) - Number(a))
  }, [rows])

  const levels = useMemo(() => {
    return [...new Set(rows.map((row) => String(row?.level || '')).filter(Boolean))].sort()
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (yearFilter && String(row?.year || '') !== yearFilter) return false
      if (levelFilter && String(row?.level || '') !== levelFilter) return false
      if (statusFilter) {
        if (statusFilter === 'active') {
          if (row?.status === 'archived' || row?.isActive === false) return false
        } else if (statusFilter === 'archived') {
          if (row?.status !== 'archived' && row?.isActive !== false) return false
        }
      }

      const query = search.trim().toLowerCase()
      if (!query) return true

      const classes = [...new Set((row?.slots || []).map((slot) => String(slot?.class || '').trim()).filter(Boolean))]
      const haystack = [
        String(row?.level || ''),
        String(row?.year || ''),
        ...classes,
      ].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [rows, yearFilter, levelFilter, statusFilter, search])

  const stats = useMemo(() => {
    const active = rows.filter((row) => row?.status !== 'archived' && row?.isActive !== false).length
    const archived = rows.filter((row) => row?.status === 'archived' || row?.isActive === false).length
    const totalSlots = rows.reduce((sum, row) => sum + (Array.isArray(row?.slots) ? row.slots.length : 0), 0)
    const latest = rows
      .map((row) => row?.updatedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0]

    return {
      total: rows.length,
      active,
      archived,
      totalSlots,
      latest: formatDate(latest),
    }
  }, [rows])

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Manage level timetables and open class/teacher views from the same dataset."
        right={<Button onClick={load} disabled={loading}>Refresh</Button>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          Total Timetables
          <div className="text-xl font-semibold mt-1">{loading ? '...' : stats.total}</div>
        </Card>
        <Card>
          Active Timetables
          <div className="text-xl font-semibold mt-1">{loading ? '...' : stats.active}</div>
        </Card>
        <Card>
          Archived Timetables
          <div className="text-xl font-semibold mt-1">{loading ? '...' : stats.archived}</div>
        </Card>
        <Card>
          Total Periods
          <div className="text-xl font-semibold mt-1">{loading ? '...' : stats.totalSlots}</div>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {canCreate ? <ButtonLink href={`${roleBase}/timetable/create`} variant="primary">+ Create Timetable</ButtonLink> : null}
        <ButtonLink href={`${roleBase}/timetable/by-class`} variant="outline">By Class</ButtonLink>
        <ButtonLink href={`${roleBase}/timetable/by-teacher`} variant="outline">By Teacher</ButtonLink>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </Select>
        <Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="">All Levels</option>
          {levels.map((level) => <option key={level} value={level}>{level}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </Select>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search level or class..." />
      </div>

      <Card className="mt-6 overflow-auto">
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th className="py-2">Level</th>
                <th>Year</th>
                <th>Classes</th>
                <th>Periods</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const classes = [...new Set((row?.slots || []).map((slot) => String(slot?.class || '').trim()).filter(Boolean))]
                const isArchived = row?.status === 'archived' || row?.isActive === false
                return (
                  <tr key={row._id} className="border-b last:border-none hover:bg-gray-50">
                    <td className="py-2">{row?.level || '—'}</td>
                    <td>{row?.year || '—'}</td>
                    <td>{classes.length}</td>
                    <td>{Array.isArray(row?.slots) ? row.slots.length : 0}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isArchived
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isArchived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{formatDate(row?.updatedAt)}</td>
                    <td className="text-right">
                      <div className="flex gap-1 justify-end flex-wrap">
                        <Button onClick={() => exportRowPDF(row)} variant="outline" size="sm">Export PDF</Button>
                        {!isArchived && (
                          <>
                            <ButtonLink href={`${roleBase}/timetable/edit/${row._id}`} variant="outline" size="sm">Edit</ButtonLink>
                            <Button onClick={() => handleClone(row)} variant="outline" size="sm">Duplicate</Button>
                            <Button onClick={() => handleArchive(row._id)} variant="outline" size="sm" className="text-amber-600">Archive</Button>
                          </>
                        )}
                        {isArchived && (
                          <Button onClick={() => handleDelete(row._id)} variant="outline" size="sm" className="text-red-600">Delete Permanently</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!filteredRows.length ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">No timetables match the current filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
