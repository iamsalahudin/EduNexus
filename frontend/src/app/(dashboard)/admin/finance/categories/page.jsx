'use client'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Textarea } from '@/components/ui'
import {
  createFinanceCategory,
  deleteFinanceCategory,
  fetchFinanceCategories,
  updateFinanceCategory
} from '@/services/financeService'

export default function FinanceCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterType, setFilterType] = useState('')
  const [query, setQuery] = useState('')

  const [debitForm, setDebitForm] = useState({ name: '', description: '' })
  const [creditForm, setCreditForm] = useState({ name: '', description: '' })
  const [editId, setEditId] = useState('')
  const [editForm, setEditForm] = useState({ name: '', description: '', active: true, type: 'debit' })

  async function loadCategories() {
    try {
      setLoading(true)
      setError('')
      const rows = await fetchFinanceCategories({ q: query, type: filterType })
      setCategories(rows)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load finance categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleRows = useMemo(() => {
    return categories
  }, [categories])

  async function createCategory(type) {
    const form = type === 'debit' ? debitForm : creditForm
    if (!String(form.name || '').trim()) {
      setError('Category name is required.')
      return
    }
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await createFinanceCategory({
        name: form.name,
        description: form.description,
        type
      })
      setSuccess(`${type === 'debit' ? 'Debit' : 'Credit'} category created.`)
      if (type === 'debit') setDebitForm({ name: '', description: '' })
      else setCreditForm({ name: '', description: '' })
      await loadCategories()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create category.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(row) {
    setEditId(row.id)
    setEditForm({
      name: row.name || '',
      description: row.description || '',
      active: row.active !== false,
      type: row.type || 'debit'
    })
  }

  async function saveEdit() {
    if (!editId) return
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await updateFinanceCategory(editId, editForm)
      setSuccess('Category updated.')
      setEditId('')
      await loadCategories()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update category.')
    } finally {
      setSaving(false)
    }
  }

  async function removeCategory(id) {
    const confirmed = window.confirm('Delete this category? This is blocked if linked entries exist.')
    if (!confirmed) return
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await deleteFinanceCategory(id)
      setSuccess('Category deleted.')
      await loadCategories()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Categories"
        subtitle="Manage debit and credit categories with linked entry counts."
      />

      {error ? <Card className="border border-red-200 bg-red-50 text-red-700">{error}</Card> : null}
      {success ? <Card className="border border-emerald-200 bg-emerald-50 text-emerald-700">{success}</Card> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold text-gray-900">New Debit Category</h3>
          <div className="mt-3 space-y-3">
            <Input placeholder="Name" value={debitForm.name} onChange={(e) => setDebitForm((s) => ({ ...s, name: e.target.value }))} />
            <Textarea placeholder="Description" value={debitForm.description} onChange={(e) => setDebitForm((s) => ({ ...s, description: e.target.value }))} rows={3} />
            <Button type="button" onClick={() => createCategory('debit')} disabled={saving}>Create Debit</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900">New Credit Category</h3>
          <div className="mt-3 space-y-3">
            <Input placeholder="Name" value={creditForm.name} onChange={(e) => setCreditForm((s) => ({ ...s, name: e.target.value }))} />
            <Textarea placeholder="Description" value={creditForm.description} onChange={(e) => setCreditForm((s) => ({ ...s, description: e.target.value }))} rows={3} />
            <Button type="button" onClick={() => createCategory('credit')} disabled={saving}>Create Credit</Button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Search categories" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </Select>
          <Button type="button" onClick={loadCategories} disabled={loading}>Refresh</Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-900">Category List</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 pr-3">Linked Entries</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-4 text-center text-gray-500">Loading...</td></tr>
              ) : visibleRows.length ? (
                visibleRows.map((row) => (
                  <tr key={row.id} className="border-b align-top">
                    <td className="py-3 pr-3 font-medium">{row.name}</td>
                    <td className="py-3 pr-3 capitalize">{row.type}</td>
                    <td className="py-3 pr-3">{row.description || '-'}</td>
                    <td className="py-3 pr-3">{row.linkedCount || 0}</td>
                    <td className="py-3 pr-3">{row.active ? 'Active' : 'Inactive'}</td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}>Edit</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeCategory(row.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="py-4 text-center text-gray-500">No categories found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editId ? (
        <Card>
          <h3 className="font-semibold text-gray-900">Edit Category</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} placeholder="Name" />
            <Select value={editForm.type} onChange={(e) => setEditForm((s) => ({ ...s, type: e.target.value }))}>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </Select>
          </div>
          <div className="mt-3">
            <Textarea value={editForm.description} onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} rows={3} placeholder="Description" />
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" onClick={saveEdit} disabled={saving}>Save</Button>
            <Button type="button" variant="outline" onClick={() => setEditId('')}>Cancel</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditForm((s) => ({ ...s, active: !s.active }))}
            >
              Mark as {editForm.active ? 'Inactive' : 'Active'}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <h3 className="font-semibold text-gray-900">Category Guidance</h3>
        <div className="mt-2 text-sm text-gray-700">
          Use debit categories for expenses and repayments, and credit categories for incomes and liability intake.
        </div>
      </Card>
    </div>
  )
}
