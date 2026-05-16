"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import homeworksService from '@/services/homeworksService'
import { HOMEWORK_STATUS, getStatusColor } from '@/utils/constants'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

function summarizeSubmissions(submissions = []) {
  const stats = { draft: 0, submitted: 0, received: 0, returned: 0 }
  submissions.forEach((item) => {
    const key = String(item?.status || HOMEWORK_STATUS.DRAFT)
    if (stats[key] !== undefined) stats[key] += 1
  })
  return stats
}

function statusBadge(status) {
  const s = String(status || '')
  if (s === HOMEWORK_STATUS.PUBLISHED || s === HOMEWORK_STATUS.CLOSED || s === HOMEWORK_STATUS.DRAFT) return getStatusColor(s)
  return 'inline-flex px-2 py-1 rounded text-xs border border-gray-200 text-gray-700'
}

export default function HomeworkSubmissionsWorkspace({ title, subtitle, roleBase, requireClassSection = false, feedbackOnly = false }) {
  const [loading, setLoading] = useState(true)
  const [bootLoading, setBootLoading] = useState(true)
  const [error, setError] = useState('')
  const [classes, setClasses] = useState([])
  const [homeworks, setHomeworks] = useState([])
  const [cls, setCls] = useState('')
  const [section, setSection] = useState('')

  const selectedClass = useMemo(() => classes.find((c) => String(c?.name) === String(cls)) || null, [classes, cls])
  const sections = useMemo(() => (Array.isArray(selectedClass?.sections) ? selectedClass.sections : []), [selectedClass])

  async function boot() {
    setBootLoading(true)
    try {
      const cRes = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(cRes?.classes) ? cRes.classes : [])
    } catch {
      setClasses([])
    } finally {
      setBootLoading(false)
    }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (cls) params.class = cls
      if (section) params.section = section
      if (requireClassSection && (!params.class || !params.section)) {
        setHomeworks([])
        setLoading(false)
        return
      }
      const res = await homeworksService.list(params)
      setHomeworks(Array.isArray(res?.homeworks) ? res.homeworks : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load homework submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    boot()
  }, [])

  useEffect(() => {
    if (section && !sections.includes(section)) setSection('')
  }, [sections, section])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, section])

  const rows = useMemo(() => {
    const list = [...homeworks]
    const filtered = feedbackOnly
      ? list.filter((hw) => Array.isArray(hw.submissions) && hw.submissions.some((s) => ['received', 'returned'].includes(String(s?.status))))
      : list

    return filtered
      .map((hw) => ({
        id: hw._id,
        title: hw.title,
        class: hw.class,
        section: hw.section,
        subject: hw.subjectName || hw?.subject?.name || '—',
        dueDate: hw.dueDate,
        status: hw.status,
        submissions: summarizeSubmissions(hw.submissions || []),
        total: Array.isArray(hw.submissions) ? hw.submissions.length : 0
      }))
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
  }, [homeworks, feedbackOnly])

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalHomework += 1
        acc.totalSubmitted += row.submissions.submitted
        acc.totalReceived += row.submissions.received
        acc.totalReturned += row.submissions.returned
        return acc
      },
      { totalHomework: 0, totalSubmitted: 0, totalReceived: 0, totalReturned: 0 }
    )
  }, [rows])

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} right={<Button onClick={load} disabled={loading || bootLoading}>Refresh</Button>} />
      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={cls} onChange={(e) => setCls(e.target.value)}>
            <option value="">{requireClassSection ? 'Select class' : 'All classes'}</option>
            {classes.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
          </Select>
          <Select value={section} onChange={(e) => setSection(e.target.value)} disabled={!cls || sections.length === 0}>
            <option value="">{requireClassSection ? 'Select section' : 'All sections'}</option>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="text-sm text-gray-600 flex items-center">
            {requireClassSection ? 'Class + section are required for this role.' : 'Optional filtering by class and section.'}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><div className="text-sm text-gray-600">Homework Items</div><div className="text-xl font-semibold mt-1">{summary.totalHomework}</div></Card>
        <Card><div className="text-sm text-gray-600">Submitted</div><div className="text-xl font-semibold mt-1">{summary.totalSubmitted}</div></Card>
        <Card><div className="text-sm text-gray-600">Received</div><div className="text-xl font-semibold mt-1">{summary.totalReceived}</div></Card>
        <Card><div className="text-sm text-gray-600">Returned</div><div className="text-xl font-semibold mt-1">{summary.totalReturned}</div></Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-medium">Submission Tracker</h2>
        <div className="mt-3 overflow-auto">
          {(loading || bootLoading) ? (
            <Skeleton className="h-40" />
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">No homework submissions found for current filter.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">HW Status</th>
                  <th className="py-2 pr-3">Submitted</th>
                  <th className="py-2 pr-3">Received</th>
                  <th className="py-2 pr-3">Returned</th>
                  <th className="py-2 pr-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{row.title}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.class}-{row.section}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.subject}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(row.dueDate)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap"><span className={statusBadge(row.status)}>{row.status}</span></td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.submissions.submitted}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.submissions.received}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.submissions.returned}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <ButtonLink href={`${roleBase}/homework/${row.id}`} size="sm" variant="outline">Open</ButtonLink>
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
