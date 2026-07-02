'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow, Textarea } from '@/components/ui'
import { createFinanceExpense, deleteFinanceExpense, fetchFinanceCategories, fetchFinanceExpenses, updateFinanceExpense } from '@/services/financeService'
import { exportCsv } from '@/components/finance/exportHelpers'

export default function FinanceExpensesWorkspace({
  title = 'Expense Tracking',
  subtitle = 'Create and manage finance expense entries with category and date filters.'
}) {
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
          q: query || undefined,
          categoryId: categoryFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
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

  function downloadCsv() {
    exportCsv({
      headers: ['Title', 'Category', 'Amount', 'Payment Method', 'Date', 'Note'],
      rows: records,
      mapRow: (row) => [
        row.title || '-',
        row.categoryName || '-',
        row.amount || 0,
        row.paymentMethod || 'cash',
        row.expenseDate ? new Date(row.expenseDate).toLocaleDateString() : '-',
        row.note || ''
      ],
      filename: 'expense-records.csv'
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

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
            <StatCard label="Total Expenses" value={`Rs ${Number(totals?.amount || 0).toLocaleString()}`} />
            <StatCard label="Entries" value={Number(totals?.count || 0).toLocaleString()} />
            <StatCard label="Filtered Category" value={categoryFilter ? 'Selected' : 'All'} />
            <StatCard label="Date Range" value={startDate || endDate ? 'Applied' : 'All time'} />
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
            {editId ? (
              <Button type="button" variant="outline" onClick={() => { setEditId(''); setForm({ title: '', amount: '', categoryId: '', paymentMethod: 'cash', expenseDate: '', note: '' }) }}>Cancel</Button>
            ) : null}
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
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, note, category" />
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

        <Table>
          <TableRoot>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader className="text-right">Amount</TableHeader>
                <TableHeader>Method</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">Loading...</TableCell>
                </TableRow>
              ) : records.length ? (
                records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{record.title || '-'}</TableCell>
                    <TableCell>{record.categoryName || '-'}</TableCell>
                    <TableCell className="text-right">Rs {Number(record.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{record.paymentMethod || 'cash'}</TableCell>
                    <TableCell>{record.expenseDate ? new Date(record.expenseDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(record)}>Edit</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => removeExpense(record.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">No records found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </TableRoot>
        </Table>
      </Card>
    </div>
  )
}
