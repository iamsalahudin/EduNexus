'use client'

import { useMemo, useState } from 'react'
import examsService from '@/services/examsService'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Textarea } from '@/components/ui'

function stateBadge(state) {
  if (state === 'published') return 'inline-flex px-2 py-1 rounded text-xs border border-green-200 text-green-700 bg-green-50'
  if (state === 'pending') return 'inline-flex px-2 py-1 rounded text-xs border border-amber-200 text-amber-700 bg-amber-50'
  if (state === 'draft') return 'inline-flex px-2 py-1 rounded text-xs border border-slate-200 text-slate-700 bg-slate-50'
  return 'inline-flex px-2 py-1 rounded text-xs border border-blue-200 text-blue-700 bg-blue-50'
}

function monthOptions() {
  return [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
  ]
}

export default function CreateExamPage() {
  const currentYear = new Date().getFullYear()

  const [type, setType] = useState('mid')
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')

  const [loadingSummary, setLoadingSummary] = useState(false)
  const [runningSetup, setRunningSetup] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [summary, setSummary] = useState(null)

  const rows = useMemo(() => (Array.isArray(summary?.rows) ? summary.rows : []), [summary])

  async function loadSummary() {
    setLoadingSummary(true)
    setError('')
    setSuccess('')
    try {
      const data = await examsService.listSetupSummary({
        type,
        year: Number(year),
        ...(type === 'monthly' ? { month: Number(month) } : {})
      })
      setSummary(data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load setup summary')
    } finally {
      setLoadingSummary(false)
    }
  }

  async function runBulkSetup() {
    setRunningSetup(true)
    setError('')
    setSuccess('')
    try {
      const result = await examsService.bulkSetupAllClasses({
        type,
        year: Number(year),
        ...(type === 'monthly' ? { month: Number(month) } : {}),
        name: name || undefined,
        instructions: instructions || undefined
      })

      const s = result?.summary || {}
      setSuccess(`Bulk setup completed: ${s.created || 0} created, ${s.reused || 0} reused, ${s.failed || 0} failed.`)
      await loadSummary()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to run bulk setup')
    } finally {
      setRunningSetup(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Exam Setup"
        subtitle="Create exam instances for all classes and auto-attach class subjects."
        right={<ButtonLink href="/admin/exams">Back to Exams</ButtonLink>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select label="Exam Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="mid">Mid</option>
            <option value="final">Final</option>
            <option value="custom">Custom</option>
          </Select>

          <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />

          <Select
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            disabled={type !== 'monthly'}
          >
            {monthOptions().map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>

          <Input label="Exam Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="mt-4">
          <Textarea
            label="Instructions (optional)"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={loadSummary} disabled={loadingSummary || runningSetup}>
            {loadingSummary ? 'Loading…' : 'Load Pending Summary'}
          </Button>
          <Button type="button" variant="primary" onClick={runBulkSetup} disabled={runningSetup}>
            {runningSetup ? 'Creating…' : 'Create/Update All Classes'}
          </Button>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-medium">Per Class Status</h2>
        <div className="mt-3 overflow-auto">
          {!summary ? (
            <div className="text-sm text-gray-600">Load summary to see pending/draft/published state by class.</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">No classes found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3">Exam</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.className} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{r.className}</td>
                    <td className="py-2 pr-3 whitespace-nowrap"><span className={stateBadge(r.state)}>{r.state}</span></td>
                    <td className="py-2 pr-3 whitespace-nowrap">{r?.exam?._id || '—'}</td>
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
