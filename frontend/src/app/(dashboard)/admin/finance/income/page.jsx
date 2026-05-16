'use client'
import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'
import { fetchFeesSummary, fetchFeeRecords } from '@/services/feesService'
import {
  createLiabilityIntake,
  fetchFinanceCategories,
  fetchFinanceLiabilities,
  repayLiability
} from '@/services/financeService'
import { FINANCE_PAYMENT_STATUS } from '@/utils/constants'

export default function IncomeManagementPage() {
  const [summary, setSummary] = useState(null)
  const [records, setRecords] = useState([])
  const [liabilities, setLiabilities] = useState([])
  const [liabilityTotals, setLiabilityTotals] = useState({ count: 0, amount: 0, outstanding: 0 })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [intakeForm, setIntakeForm] = useState({
    title: '',
    debtorName: '',
    amount: '',
    categoryId: '',
    incurredDate: '',
    note: ''
  })
  const [repayDraft, setRepayDraft] = useState({})

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const [summaryData, recordsData, liabilitiesData, categoriesData] = await Promise.all([
        fetchFeesSummary(),
        fetchFeeRecords(),
        fetchFinanceLiabilities({}),
        fetchFinanceCategories({ type: 'credit', active: 'true' })
      ])
      setSummary(summaryData)
      setRecords(recordsData)
      setLiabilities(liabilitiesData.liabilities)
      setLiabilityTotals(liabilitiesData.totals)
      setCategories(categoriesData)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load income data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const classOptions = [...new Set(records.map(r => r.class))].filter(Boolean).sort()
  const statusOptions = Object.values(FINANCE_PAYMENT_STATUS).map(val => val)

  const filteredRecords = records.filter(r => {
    const matchesQuery = !query || 
      String(r.studentName || '').toLowerCase().includes(query.toLowerCase()) ||
      String(r.class || '').toLowerCase().includes(query.toLowerCase())
    const matchesClass = !classFilter || r.class === classFilter
    const matchesStatus = !statusFilter || r.status === statusFilter
    return matchesQuery && matchesClass && matchesStatus
  })

  async function submitLiabilityIntake() {
    if (!String(intakeForm.title || '').trim() || !String(intakeForm.debtorName || '').trim() || !Number(intakeForm.amount)) {
      setError('Title, debtor name, and amount are required for liability intake.')
      return
    }
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await createLiabilityIntake({
        title: intakeForm.title,
        debtorName: intakeForm.debtorName,
        amount: Number(intakeForm.amount),
        categoryId: intakeForm.categoryId || null,
        incurredDate: intakeForm.incurredDate || null,
        note: intakeForm.note
      })
      setSuccess('Liability intake recorded and linked income created.')
      setIntakeForm({ title: '', debtorName: '', amount: '', categoryId: '', incurredDate: '', note: '' })
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create liability intake.')
    } finally {
      setSaving(false)
    }
  }

  async function submitRepayment(liabilityId) {
    const draft = repayDraft[liabilityId] || { amount: '', paymentMethod: 'cash', paymentDate: '', note: '' }
    if (!Number(draft.amount)) {
      setError('Repayment amount is required.')
      return
    }
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await repayLiability(liabilityId, {
        amount: Number(draft.amount),
        paymentMethod: draft.paymentMethod || 'cash',
        paymentDate: draft.paymentDate || null,
        note: draft.note || ''
      })
      setSuccess('Repayment recorded and linked expense created.')
      setRepayDraft((state) => ({ ...state, [liabilityId]: { amount: '', paymentMethod: 'cash', paymentDate: '', note: '' } }))
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to record repayment.')
    } finally {
      setSaving(false)
    }
  }

  async function downloadCsv() {
    const headers = ['Student Name', 'Class', 'Amount', 'Status', 'Due Date']
    const rows = filteredRecords.map(r => [
      r.studentName || '—',
      r.class || '—',
      r.amount || 0,
      r.status || '—',
      r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'income-records.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income Management"
        subtitle="Monitor fee collections and pending liabilities from student records."
        right={(
          <ButtonLink href="/admin/fees/record" variant="secondary">View all fees</ButtonLink>
        )}
      />

      {error ? (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      ) : null}

      {success ? (
        <Card className="border border-emerald-200 bg-emerald-50 text-emerald-700">
          {success}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <Card>
              <div className="text-xs uppercase tracking-wide text-gray-500">Total Collected</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">Rs {Number(summary?.totalCollected || 0).toLocaleString()}</div>
            </Card>
            <Card>
              <div className="text-xs uppercase tracking-wide text-gray-500">This Month</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">Rs {Number(summary?.paidThisMonth || 0).toLocaleString()}</div>
            </Card>
            <Card>
              <div className="text-xs uppercase tracking-wide text-gray-500">Pending Count</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{Number(summary?.pendingCount || 0).toLocaleString()}</div>
            </Card>
            <Card>
              <div className="text-xs uppercase tracking-wide text-gray-500">Total Students</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{Number(summary?.totalStudents || 0).toLocaleString()}</div>
            </Card>
          </>
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Fee Records</h2>
            <p className="text-sm text-gray-600 mt-1">Showing {filteredRecords.length} records</p>
          </div>
          <Button onClick={downloadCsv} variant="outline" disabled={!filteredRecords.length}>Download CSV</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name or class"
          />
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {statusOptions.map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
          </Select>
          <div className="text-sm text-gray-600 flex items-center justify-end">Total: {filteredRecords.length}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Student Name</th>
                <th className="text-left py-3 px-2">Class</th>
                <th className="text-right py-3 px-2">Amount</th>
                <th className="text-center py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4 text-gray-500">Loading...</td></tr>
              ) : filteredRecords.length ? (
                filteredRecords.map((record, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{record.studentName || '—'}</td>
                    <td className="py-3 px-2">{record.class || '—'}</td>
                    <td className="py-3 px-2 text-right">Rs {Number(record.amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        record.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        record.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {record.status || 'unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-2">{record.dueDate ? new Date(record.dueDate).toLocaleDateString() : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Debt / Liability Intake</h2>
          <p className="mt-1 text-sm text-gray-600">Creating intake also creates a corresponding income entry.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input placeholder="Title" value={intakeForm.title} onChange={(e) => setIntakeForm((s) => ({ ...s, title: e.target.value }))} />
            <Input placeholder="Debtor / Source" value={intakeForm.debtorName} onChange={(e) => setIntakeForm((s) => ({ ...s, debtorName: e.target.value }))} />
            <Input type="number" placeholder="Amount" value={intakeForm.amount} onChange={(e) => setIntakeForm((s) => ({ ...s, amount: e.target.value }))} />
            <Select value={intakeForm.categoryId} onChange={(e) => setIntakeForm((s) => ({ ...s, categoryId: e.target.value }))}>
              <option value="">No Category</option>
              {categories.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </Select>
            <Input type="date" value={intakeForm.incurredDate} onChange={(e) => setIntakeForm((s) => ({ ...s, incurredDate: e.target.value }))} />
            <div className="flex items-center">
              <Button type="button" onClick={submitLiabilityIntake} disabled={saving}>{saving ? 'Saving...' : 'Create Intake'}</Button>
            </div>
          </div>
          <div className="mt-3">
            <Textarea rows={3} placeholder="Note" value={intakeForm.note} onChange={(e) => setIntakeForm((s) => ({ ...s, note: e.target.value }))} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Liability Totals</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Records</div>
              <div className="mt-1 text-lg font-semibold">{Number(liabilityTotals.count || 0).toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Total Amount</div>
              <div className="mt-1 text-lg font-semibold">Rs {Number(liabilityTotals.amount || 0).toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Outstanding</div>
              <div className="mt-1 text-lg font-semibold">Rs {Number(liabilityTotals.outstanding || 0).toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Liability Management</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Debtor</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Outstanding</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Repay</th>
              </tr>
            </thead>
            <tbody>
              {liabilities.length ? liabilities.map((row) => {
                const draft = repayDraft[row.id] || { amount: '', paymentMethod: 'cash', paymentDate: '', note: '' }
                return (
                  <tr key={row.id} className="border-b align-top">
                    <td className="py-3 pr-3 font-medium">{row.title}</td>
                    <td className="py-3 pr-3">{row.debtorName}</td>
                    <td className="py-3 pr-3">Rs {Number(row.amount || 0).toLocaleString()}</td>
                    <td className="py-3 pr-3">Rs {Number(row.outstandingAmount || 0).toLocaleString()}</td>
                    <td className="py-3 pr-3 capitalize">{row.status}</td>
                    <td className="py-3 pr-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input type="number" placeholder="Amount" value={draft.amount} onChange={(e) => setRepayDraft((s) => ({ ...s, [row.id]: { ...draft, amount: e.target.value } }))} />
                        <Select value={draft.paymentMethod} onChange={(e) => setRepayDraft((s) => ({ ...s, [row.id]: { ...draft, paymentMethod: e.target.value } }))}>
                          <option value="cash">Cash</option>
                          <option value="bank">Bank</option>
                          <option value="online">Online</option>
                          <option value="card">Card</option>
                          <option value="other">Other</option>
                        </Select>
                        <Input type="date" value={draft.paymentDate} onChange={(e) => setRepayDraft((s) => ({ ...s, [row.id]: { ...draft, paymentDate: e.target.value } }))} />
                        <Button type="button" onClick={() => submitRepayment(row.id)} disabled={saving || row.status === 'closed'}>
                          {row.status === 'closed' ? 'Closed' : 'Repay'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan="6" className="py-4 text-center text-gray-500">No liabilities yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
