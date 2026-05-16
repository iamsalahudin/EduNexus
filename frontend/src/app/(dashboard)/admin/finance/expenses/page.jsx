'use client'
import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton, StatCard, Textarea } from '@/components/ui'
import {
  createFinanceExpense,
  deleteFinanceExpense,
  fetchFinanceCategories,
  fetchFinanceExpenses,
  updateFinanceExpense
} from '@/services/financeService'

export default function ExpensesPage() {
  const [categories, setCategories] = useState([])
  const [records, setRecords] = useState([])
  const [totals, setTotals] = useState({ count: 0, amount: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [editId, setEditId] = useState('')

  const [form, setForm] = useState({
    title: '',
    amount: '',
    categoryId: '',
    paymentMethod: 'cash',
    expenseDate: '',
    note: ''
  })

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const [categoriesData, expensesData] = await Promise.all([
        fetchFinanceCategories({ type: 'debit', active: 'true' }),
        fetchFinanceExpenses({
          q: query,
          categoryId: categoryFilter,
          startDate,
          endDate
        })
      ])
      setCategories(categoriesData)
      setRecords(expensesData.expenses)
      setTotals(expensesData.totals)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load expense data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function downloadCsv() {
    const headers = ['Title', 'Category', 'Amount', 'Payment Method', 'Date', 'Note']
    const rows = records.map(r => [
      r.title || '-',
      r.categoryName || '-',
      r.amount || 0,
      r.paymentMethod || 'cash',
      r.expenseDate ? new Date(r.expenseDate).toLocaleDateString() : '-',
      r.note || ''
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expense-records.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function saveExpense() {
    if (!String(form.title || '').trim() || !Number(form.amount)) {
      setError('Title and amount are required.')
      return
    }
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const payload = {
        title: form.title,
        amount: Number(form.amount),
        categoryId: form.categoryId || null,
        paymentMethod: form.paymentMethod,
        expenseDate: form.expenseDate || null,
        note: form.note
      }
      if (editId) {
        await updateFinanceExpense(editId, payload)
        setSuccess('Expense updated.')
      } else {
        await createFinanceExpense(payload)
        setSuccess('Expense created.')
      }
      setEditId('')
      setForm({ title: '', amount: '', categoryId: '', paymentMethod: 'cash', expenseDate: '', note: '' })
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save expense.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(row) {
    setEditId(row.id)
    setForm({
      title: row.title || '',
      amount: String(row.amount || ''),
      categoryId: row.categoryId || '',
      paymentMethod: row.paymentMethod || 'cash',
      expenseDate: row.expenseDate ? new Date(row.expenseDate).toISOString().slice(0, 10) : '',
      note: row.note || ''
    })
  }

  async function removeExpense(id) {
    const ok = window.confirm('Delete this expense record?')
    if (!ok) return
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await deleteFinanceExpense(id)
      setSuccess('Expense deleted.')
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete expense.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Tracking"
        subtitle="Create and manage finance expense entries with category and date filters."
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Expenses"
              value={`Rs ${Number(totals?.amount || 0).toLocaleString()}`}
            />
            <StatCard
              label="Entries"
              value={Number(totals?.count || 0).toLocaleString()}
            />
            <StatCard
              label="Filtered Category"
              value={categoryFilter ? 'Selected' : 'All'}
            />
            <StatCard
              label="Date Range"
              value={startDate || endDate ? 'Applied' : 'All time'}
            />
          </>
        )}
      </div>

      <Card>
        <h2 className="text-lg font-semibold">{editId ? 'Edit Expense' : 'Add Expense'}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
          <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
          <Select value={form.categoryId} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}>
            <option value="">No Category</option>
            {categories.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </Select>
          <Select value={form.paymentMethod} onChange={(e) => setForm((s) => ({ ...s, paymentMethod: e.target.value }))}>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="online">Online</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </Select>
          <Input type="date" value={form.expenseDate} onChange={(e) => setForm((s) => ({ ...s, expenseDate: e.target.value }))} />
          <div className="flex gap-2">
            <Button type="button" onClick={saveExpense} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</Button>
            {editId ? <Button type="button" variant="outline" onClick={() => { setEditId(''); setForm({ title: '', amount: '', categoryId: '', paymentMethod: 'cash', expenseDate: '', note: '' }) }}>Cancel</Button> : null}
          </div>
        </div>
        <div className="mt-3">
          <Textarea rows={3} placeholder="Note" value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Expense Records</h2>
            <p className="text-sm text-gray-600 mt-1">Showing {records.length} records</p>
          </div>
          <Button onClick={downloadCsv} variant="outline" disabled={!records.length}>Download CSV</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-5 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, note, category"
          />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </Select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button type="button" onClick={loadData} disabled={loading}>Apply Filters</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Title</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-right py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2">Method</th>
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">Loading...</td></tr>
              ) : records.length ? (
                records.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{record.title || '-'}</td>
                    <td className="py-3 px-2">{record.categoryName || '-'}</td>
                    <td className="py-3 px-2 text-right">Rs {Number(record.amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-2">{record.paymentMethod || 'cash'}</td>
                    <td className="py-3 px-2">{record.expenseDate ? new Date(record.expenseDate).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(record)}>Edit</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => removeExpense(record.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
