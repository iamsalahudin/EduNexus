'use client'

import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button, ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import { fetchFeesSummary, generateMonthlyFees } from '@/services/feesService'

export default function FeesDashboard({
  title = 'Fees',
  subtitle = 'Manage fee structure, voucher, collection, records, defaulters, and reports from one place.',
  showGenerate = false,
  showFinanceRef = false,
  actionLinks = [],
  financeLinks = []
}) {
  const [summary, setSummary] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadSummary() {
    const data = await fetchFeesSummary()
    setSummary(data)
  }

  useEffect(() => {
    let mounted = true
    loadSummary().catch(() => {
      if (mounted) setError('Unable to load fee summary.')
    })
    return () => {
      mounted = false
    }
  }, [])

  async function handleGenerateMonthly() {
    setBusy(true)
    setMessage('')
    setError('')
    try {
      const res = await generateMonthlyFees({})
      await loadSummary()
      setMessage(`Monthly fee generation completed for ${res.month}. Added ${res.createdCount} new entries.`)
    } catch {
      setError('Unable to generate monthly fees.')
    } finally {
      setBusy(false)
    }
  }

  const chartData = useMemo(() => {
    if (!summary) return []
    return Array.isArray(summary.monthlySeries)
      ? summary.monthlySeries.map((row) => ({ name: row.name, collected: Number(row.collected || 0) }))
      : []
  }, [summary])

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={(
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={loadSummary} disabled={busy}>Refresh</Button>
            {showGenerate ? (
              <Button type="button" onClick={handleGenerateMonthly} disabled={busy}>
                {busy ? 'Generating...' : 'Generate Monthly Fees'}
              </Button>
            ) : null}
          </div>
        )}
      />

      {message ? <div className="mt-3 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Total Students</div>
          <div className="text-xl font-semibold mt-1">{summary ? summary.totalStudents : '...'}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Paid This Month</div>
          <div className="text-xl font-semibold mt-1">{summary ? summary.paidThisMonth : '...'}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Pending Count</div>
          <div className="text-xl font-semibold mt-1">{summary ? summary.pendingCount : '...'}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Total Collected</div>
          <div className="text-xl font-semibold mt-1">{summary ? `Rs ${summary.totalCollected}` : '...'}</div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-medium">Monthly Collection</h3>
          <div className="h-48 mt-3">
            {!summary ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)' }}
                    labelStyle={{ color: 'var(--color-text)' }}
                    itemStyle={{ color: 'var(--color-text)' }}
                  />
                  <Line type="monotone" dataKey="collected" stroke="var(--color-primary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        {showFinanceRef ? (
          <Card>
            <h3 className="font-medium">Finance Reference</h3>
            <p className="text-sm text-gray-600 mt-2">
              Fee collection reflects admin finance credit. Pending fee reflects admin finance liability for current month.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {financeLinks.map((link) => (
                <ButtonLink key={link.href} href={link.href} variant={link.variant || 'outline'}>
                  {link.label}
                </ButtonLink>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      {actionLinks.length ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {actionLinks.map((link) => (
            <ButtonLink key={link.href} href={link.href} variant={link.variant || 'outline'}>
              {link.label}
            </ButtonLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}
