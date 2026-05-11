"use client"

import { useEffect, useMemo, useState } from 'react'
import examsService from '@/services/examsService'
import { Button, ButtonLink, Card, PageHeader, Select } from '@/components/ui'

function monthOptions() {
  return [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
  ]
}

function badgeClass(status) {
  if (status === 'published') return 'inline-flex px-2 py-1 rounded text-xs border border-green-200 text-green-700 bg-green-50'
  if (status === 'approved') return 'inline-flex px-2 py-1 rounded text-xs border border-emerald-200 text-emerald-700 bg-emerald-50'
  if (status === 'submitted') return 'inline-flex px-2 py-1 rounded text-xs border border-indigo-200 text-indigo-700 bg-indigo-50'
  if (status === 'locked') return 'inline-flex px-2 py-1 rounded text-xs border border-amber-200 text-amber-700 bg-amber-50'
  if (status === 'open') return 'inline-flex px-2 py-1 rounded text-xs border border-sky-200 text-sky-700 bg-sky-50'
  if (status === 'draft') return 'inline-flex px-2 py-1 rounded text-xs border border-slate-200 text-slate-700 bg-slate-50'
  return 'inline-flex px-2 py-1 rounded text-xs border border-gray-200 text-gray-700'
}

function canOpen(status) {
  return status !== 'published'
}

function canLock(status) {
  return status === 'open'
}

function canApprove(status) {
  return status === 'submitted'
}

function canPublish(status) {
  return status === 'approved'
}

export default function ExamLifecycleWorkspace({
  title,
  subtitle,
  baseRole,
  setupHref
}) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [type, setType] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [archivedMode, setArchivedMode] = useState('active')

  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [exams, setExams] = useState([])

  const rows = useMemo(() => (Array.isArray(exams) ? exams : []), [exams])
  const summary = useMemo(() => {
    return rows.reduce(
      (acc, exam) => {
        acc.total += 1
        if (exam?.isArchived) acc.archived += 1
        else acc.active += 1
        acc[exam?.status || 'draft'] = (acc[exam?.status || 'draft'] || 0) + 1
        return acc
      },
      { total: 0, active: 0, archived: 0, draft: 0, open: 0, locked: 0, submitted: 0, approved: 0, published: 0 }
    )
  }, [rows])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await examsService.listExams({
        year: Number(year),
        type: type || undefined,
        ...(type === 'monthly' ? { month: Number(month) } : {}),
        archived: archivedMode
      })
      setExams(Array.isArray(res?.exams) ? res.exams : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, type, month, archivedMode])

  async function runAction(examId, action) {
    setBusyId(String(examId))
    setError('')
    setSuccess('')
    try {
      if (action === 'open') await examsService.openExam(examId)
      else if (action === 'lock') await examsService.lockExam(examId)
      else if (action === 'approve') await examsService.approveExam(examId)
      else if (action === 'publish') await examsService.publishExam(examId)
      else if (action === 'archive') await examsService.archiveExam(examId)
      else if (action === 'hardDelete') await examsService.hardDeleteExam(examId)

      setSuccess('Action completed successfully.')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Action failed')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={
          <div className="flex gap-2">
            <Button type="button" onClick={load} disabled={loading || !!busyId}>Refresh</Button>
            {setupHref ? <ButtonLink href={setupHref}>Setup</ButtonLink> : null}
            <ButtonLink href={`/${baseRole}/exams/marks-entry`} variant="secondary">Marks Entry</ButtonLink>
          </div>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>

          <Select label="Exam Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option value="monthly">Monthly</option>
            <option value="mid">Mid</option>
            <option value="final">Final</option>
            <option value="custom">Custom</option>
          </Select>

          <Select label="Month" value={month} onChange={(e) => setMonth(e.target.value)} disabled={type !== 'monthly'}>
            {monthOptions().map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>

          <Select label="Scope" value={archivedMode} onChange={(e) => setArchivedMode(e.target.value)}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </Select>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><div className="text-sm text-gray-600">Total</div><div className="text-xl font-semibold mt-1">{summary.total}</div></Card>
        <Card><div className="text-sm text-gray-600">Active</div><div className="text-xl font-semibold mt-1">{summary.active}</div></Card>
        <Card><div className="text-sm text-gray-600">Archived</div><div className="text-xl font-semibold mt-1">{summary.archived}</div></Card>
        <Card><div className="text-sm text-gray-600">Published</div><div className="text-xl font-semibold mt-1">{summary.published}</div></Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-medium">Exam Lifecycle</h2>
        {archivedMode === 'archived' ? (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Archived exams are read-only until permanently deleted.
          </div>
        ) : null}
        <div className="mt-3 overflow-auto">
          {loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">No exams found for current filters.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((exam) => {
                  const isBusy = busyId === String(exam._id)
                  return (
                    <tr key={exam._id} className="border-t">
                      <td className="py-2 pr-3 whitespace-nowrap">{exam.name}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{exam.className}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{exam.type}{exam.month ? ` (${exam.month})` : ''}</td>
                      <td className="py-2 pr-3 whitespace-nowrap"><span className={badgeClass(exam.status)}>{exam.status}</span></td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {canOpen(exam.status) && !exam.isArchived ? (
                            <Button size="sm" type="button" onClick={() => runAction(exam._id, 'open')} disabled={isBusy}>Open</Button>
                          ) : null}
                          {canLock(exam.status) && !exam.isArchived ? (
                            <Button size="sm" type="button" onClick={() => runAction(exam._id, 'lock')} disabled={isBusy}>Lock</Button>
                          ) : null}
                          {canApprove(exam.status) && !exam.isArchived ? (
                            <Button size="sm" type="button" onClick={() => runAction(exam._id, 'approve')} disabled={isBusy}>Approve</Button>
                          ) : null}
                          {canPublish(exam.status) && !exam.isArchived ? (
                            <Button size="sm" type="button" onClick={() => runAction(exam._id, 'publish')} disabled={isBusy}>Publish</Button>
                          ) : null}
                          {!exam.isArchived ? (
                            <Button size="sm" variant="outline" type="button" onClick={() => {
                              if (window.confirm('Archive this exam? It will disappear from active lists.')) runAction(exam._id, 'archive')
                            }} disabled={isBusy}>Archive</Button>
                          ) : (
                            <Button size="sm" variant="outline" type="button" onClick={() => {
                              if (window.confirm('Permanently delete this archived exam? This cannot be undone.')) runAction(exam._id, 'hardDelete')
                            }} disabled={isBusy}>Hard Delete</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
