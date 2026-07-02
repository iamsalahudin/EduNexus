'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Skeleton, StatCard } from '@/components/ui'
import { fetchFinanceOverview, fetchFinanceSettings, saveFinanceSettings } from '@/services/financeService'

export default function FinancePage() {
  const [overview, setOverview] = useState(null)
  const [settings, setSettings] = useState(null)
  const [draft, setDraft] = useState({
    fiscalYear: '',
    currency: 'PKR',
    defaultIncomeCategory: '',
    defaultExpenseCategory: '',
    defaultLiabilityCategory: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadFinance() {
      try {
        setLoading(true)
        setError('')
        const [overviewData, settingsData] = await Promise.all([
          fetchFinanceOverview(),
          fetchFinanceSettings()
        ])

        if (!mounted) return

        setOverview(overviewData)
        setSettings(settingsData)
        setDraft({
          fiscalYear: settingsData?.fiscalYear || '',
          currency: settingsData?.currency || 'PKR',
          defaultIncomeCategory: settingsData?.defaultIncomeCategory || '',
          defaultExpenseCategory: settingsData?.defaultExpenseCategory || '',
          defaultLiabilityCategory: settingsData?.defaultLiabilityCategory || ''
        })
      } catch (err) {
        if (!mounted) return
        setError(err?.response?.data?.error || 'Failed to load finance overview.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadFinance()
    return () => {
      mounted = false
    }
  }, [])

  const graphData = useMemo(() => {
    return Array.isArray(overview?.graphData) ? overview.graphData : []
  }, [overview])

  const chartMax = useMemo(() => {
    return graphData.reduce((max, item) => Math.max(max, Number(item?.value) || 0), 0) || 1
  }, [graphData])

  async function handleSaveSettings(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setNotice('')
      const saved = await saveFinanceSettings(draft)
      setSettings(saved)
      setDraft({
        fiscalYear: saved?.fiscalYear || '',
        currency: saved?.currency || 'PKR',
        defaultIncomeCategory: saved?.defaultIncomeCategory || '',
        defaultExpenseCategory: saved?.defaultExpenseCategory || '',
        defaultLiabilityCategory: saved?.defaultLiabilityCategory || ''
      })
      setNotice('Finance settings saved.')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save finance settings.')
    } finally {
      setSaving(false)
    }
  }

  const summary = overview?.summary || {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Management"
        subtitle="Monitor income, expenses, liabilities, and finance defaults from one hub."
        right={(
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/finance/reports" variant="outline">Reports</ButtonLink>
            <ButtonLink href="/admin/finance/categories" variant="secondary">Categories</ButtonLink>
            <ButtonLink href="/admin/finance/income" variant="secondary">Income</ButtonLink>
            <ButtonLink href="/admin/finance/expenses" variant="secondary">Expenses</ButtonLink>
          </div>
        )}
      />

      {error ? (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      ) : null}

      {notice ? (
        <Card className="border border-emerald-200 bg-emerald-50 text-emerald-700">
          {notice}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Income"
          value={loading ? 'Loading...' : `Rs ${Number(summary.totalCollected || 0).toLocaleString()}`}
        />
        <StatCard
          label="Total Expense"
          value={loading ? 'Loading...' : `Rs ${Number(summary.totalExpenses || 0).toLocaleString()}`}
        />
        <StatCard
          label="Net Balance"
          value={loading ? 'Loading...' : `Rs ${Number(summary.netIncome || 0).toLocaleString()}`}
        />
        <StatCard
          label="Outstanding Liabilities"
          value={loading ? 'Loading...' : `Rs ${Number(summary.pendingLiabilityThisMonth || 0).toLocaleString()}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Finance trend</h2>
              <p className="text-sm text-gray-600">Live data from the analytics endpoint.</p>
            </div>
            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              {settings?.fiscalYear || draft.fiscalYear || 'Current fiscal year'}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : graphData.length ? (
              graphData.map((item) => {
                const value = Number(item?.value) || 0
                const width = `${Math.max(8, (value / chartMax) * 100)}%`
                return (
                  <div key={String(item?.label || item?.name || value)} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{item?.label || item?.name || 'Item'}</span>
                      <span className="text-gray-500">Rs {value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                No finance trend data is available yet.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Quick finance facts</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Fee collections</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">Rs {Number(overview?.feeSummary?.incomingFeeThisMonth || 0).toLocaleString()}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Payroll expense</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">Rs {Number(overview?.salarySummary?.totalPayroll || 0).toLocaleString()}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Pending fee cases</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{Number(overview?.feeSummary?.pendingCount || 0).toLocaleString()}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Salary slips pending</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{Number(overview?.salarySummary?.pendingCount || 0).toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Finance settings</h2>
          <p className="mt-1 text-sm text-gray-600">Keep the defaults aligned with your school’s accounting structure.</p>

          <form className="mt-5 space-y-4" onSubmit={handleSaveSettings}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Fiscal year"
                value={draft.fiscalYear}
                onChange={(event) => setDraft((current) => ({ ...current, fiscalYear: event.target.value }))}
                placeholder="2025-2026"
              />
              <Input
                label="Currency"
                value={draft.currency}
                onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                placeholder="PKR"
              />
            </div>

            <Input
              label="Default income category"
              value={draft.defaultIncomeCategory}
              onChange={(event) => setDraft((current) => ({ ...current, defaultIncomeCategory: event.target.value }))}
              placeholder="Tuition Fees"
            />

            <Input
              label="Default expense category"
              value={draft.defaultExpenseCategory}
              onChange={(event) => setDraft((current) => ({ ...current, defaultExpenseCategory: event.target.value }))}
              placeholder="Operational Expenses"
            />

            <Input
              label="Default liability category"
              value={draft.defaultLiabilityCategory}
              onChange={(event) => setDraft((current) => ({ ...current, defaultLiabilityCategory: event.target.value }))}
              placeholder="Outstanding Dues"
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save finance settings'}
              </Button>
              <ButtonLink href="/admin/finance/reports" variant="outline">Open reports</ButtonLink>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Module shortcuts</h2>
          <p className="mt-1 text-sm text-gray-600">Jump straight into the finance workflows used by school admins.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ButtonLink href="/admin/finance/income" variant="outline" className="justify-start">Income records</ButtonLink>
            <ButtonLink href="/admin/finance/expenses" variant="outline" className="justify-start">Expense tracking</ButtonLink>
            <ButtonLink href="/admin/finance/categories" variant="outline" className="justify-start">Finance categories</ButtonLink>
            <ButtonLink href="/admin/finance/reports" variant="outline" className="justify-start">Exports & reports</ButtonLink>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            The hub now uses live dashboard, fee, and salary endpoints so the summary cards stay in sync with the backend.
          </div>
        </Card>
      </div>
    </div>
  )
}
