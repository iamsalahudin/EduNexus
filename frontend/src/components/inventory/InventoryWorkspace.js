'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  createInventoryCategory,
  createInventoryDistribution,
  createInventoryItem,
  createInventoryStockMovement,
  deleteInventoryCategory,
  deleteInventoryDistribution,
  deleteInventoryItem,
  deleteInventoryStockMovement,
  listInventoryCategories,
  listInventoryDistributions,
  listInventoryItems,
  listInventoryStockMovements,
  updateInventoryCategory,
  updateInventoryDistribution,
  updateInventoryItem,
  updateInventoryStockMovement
} from '@/services/inventoryService'
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'

const SECTION_META = {
  overview: {
    title: 'Inventory Management',
    subtitle: 'Track categories, items, stock, and distribution records.'
  },
  categories: {
    title: 'Inventory Categories',
    subtitle: 'Manage the master list of inventory categories.'
  },
  items: {
    title: 'Inventory Items',
    subtitle: 'Manage stockable items and their current quantities.'
  },
  stock: {
    title: 'Stock Movements',
    subtitle: 'Record incoming and outgoing stock adjustments.'
  },
  distribution: {
    title: 'Inventory Distribution',
    subtitle: 'Track issued items, recipients, and return status.'
  }
}

const DEFAULT_FILTERS = {
  categories: { q: '', active: '' },
  items: { q: '', categoryId: '', status: '' },
  stock: { q: '', itemId: '', movementType: '' },
  distribution: { q: '', itemId: '', recipientType: '', status: '' }
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function getEmptyForm(section) {
  if (section === 'categories') {
    return { name: '', description: '', active: true }
  }

  if (section === 'items') {
    return {
      sku: '',
      name: '',
      categoryId: '',
      unit: 'piece',
      quantity: '0',
      minQuantity: '0',
      location: '',
      status: 'active',
      notes: ''
    }
  }

  if (section === 'stock') {
    return {
      itemId: '',
      movementType: 'in',
      quantity: '1',
      reference: '',
      note: '',
      movementDate: new Date().toISOString().slice(0, 10)
    }
  }

  if (section === 'distribution') {
    return {
      itemId: '',
      recipientName: '',
      recipientType: 'other',
      quantity: '1',
      status: 'issued',
      distributedAt: new Date().toISOString().slice(0, 10),
      note: ''
    }
  }

  return {}
}

function getCreateButtonLabel(section, editingId) {
  if (section === 'categories') return editingId ? 'Update Category' : 'Create Category'
  if (section === 'items') return editingId ? 'Update Item' : 'Create Item'
  if (section === 'stock') return editingId ? 'Update Movement' : 'Record Movement'
  if (section === 'distribution') return editingId ? 'Update Distribution' : 'Issue Item'
  return 'Save'
}

function getRecordLabel(section) {
  if (section === 'categories') return 'category'
  if (section === 'items') return 'item'
  if (section === 'stock') return 'movement'
  if (section === 'distribution') return 'distribution'
  return 'record'
}

export default function InventoryWorkspace({ section = 'overview' }) {
  const meta = SECTION_META[section] || SECTION_META.overview
  const [loading, setLoading] = useState(section !== 'overview')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [records, setRecords] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS[section] || {})
  const [form, setForm] = useState(getEmptyForm(section))
  const [editingId, setEditingId] = useState('')

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category._id, category])), [categories])
  const itemMap = useMemo(() => new Map(items.map((item) => [item._id, item])), [items])

  async function loadData(nextFilters = filters) {
    if (section === 'overview') return

    setLoading(true)
    setError('')
    try {
      const categoryPromise = listInventoryCategories({})
      const needsItems = section === 'items' || section === 'stock' || section === 'distribution'
      const itemPromise = needsItems ? listInventoryItems({}) : Promise.resolve([])

      const sectionPromise =
        section === 'categories'
          ? listInventoryCategories(nextFilters)
          : section === 'items'
            ? listInventoryItems(nextFilters)
            : section === 'stock'
              ? listInventoryStockMovements(nextFilters)
              : listInventoryDistributions(nextFilters)

      const [categoryRows, itemRows, sectionRows] = await Promise.all([categoryPromise, itemPromise, sectionPromise])
      setCategories(Array.isArray(categoryRows) ? categoryRows : [])
      setItems(Array.isArray(itemRows) ? itemRows : [])
      setRecords(Array.isArray(sectionRows) ? sectionRows : [])
    } catch (e) {
      setError(e?.response?.data?.error || `Failed to load ${getRecordLabel(section)}s`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setFilters(DEFAULT_FILTERS[section] || {})
    setForm(getEmptyForm(section))
    setEditingId('')
    if (section !== 'overview') {
      loadData(DEFAULT_FILTERS[section] || {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function resetForm() {
    setEditingId('')
    setForm(getEmptyForm(section))
  }

  function populateForm(row) {
    setEditingId(row._id)

    if (section === 'categories') {
      setForm({
        name: row.name || '',
        description: row.description || '',
        active: Boolean(row.active)
      })
      return
    }

    if (section === 'items') {
      setForm({
        sku: row.sku || '',
        name: row.name || '',
        categoryId: row.category?._id || row.category || '',
        unit: row.unit || 'piece',
        quantity: String(row.quantity ?? 0),
        minQuantity: String(row.minQuantity ?? 0),
        location: row.location || '',
        status: row.status || 'active',
        notes: row.notes || ''
      })
      return
    }

    if (section === 'stock') {
      setForm({
        itemId: row.item?._id || row.item || '',
        movementType: row.movementType || 'in',
        quantity: String(row.quantity ?? 1),
        reference: row.reference || '',
        note: row.note || '',
        movementDate: row.movementDate ? new Date(row.movementDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      })
      return
    }

    if (section === 'distribution') {
      setForm({
        itemId: row.item?._id || row.item || '',
        recipientName: row.recipientName || '',
        recipientType: row.recipientType || 'other',
        quantity: String(row.quantity ?? 1),
        status: row.status || 'issued',
        distributedAt: row.distributedAt ? new Date(row.distributedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        note: row.note || ''
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (section === 'overview') return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      let payload = {}
      if (section === 'categories') {
        payload = {
          name: form.name,
          description: form.description,
          active: Boolean(form.active)
        }
        if (editingId) {
          await updateInventoryCategory(editingId, payload)
        } else {
          await createInventoryCategory(payload)
        }
      }

      if (section === 'items') {
        payload = {
          sku: form.sku,
          name: form.name,
          categoryId: form.categoryId,
          unit: form.unit,
          quantity: Number(form.quantity || 0),
          minQuantity: Number(form.minQuantity || 0),
          location: form.location,
          status: form.status,
          notes: form.notes
        }
        if (editingId) {
          await updateInventoryItem(editingId, payload)
        } else {
          await createInventoryItem(payload)
        }
      }

      if (section === 'stock') {
        payload = {
          itemId: form.itemId,
          movementType: form.movementType,
          quantity: Number(form.quantity || 0),
          reference: form.reference,
          note: form.note,
          movementDate: form.movementDate
        }
        if (editingId) {
          await updateInventoryStockMovement(editingId, payload)
        } else {
          await createInventoryStockMovement(payload)
        }
      }

      if (section === 'distribution') {
        payload = {
          itemId: form.itemId,
          recipientName: form.recipientName,
          recipientType: form.recipientType,
          quantity: Number(form.quantity || 0),
          status: form.status,
          distributedAt: form.distributedAt,
          note: form.note
        }
        if (editingId) {
          await updateInventoryDistribution(editingId, payload)
        } else {
          await createInventoryDistribution(payload)
        }
      }

      setSuccess(editingId ? `${meta.title} updated` : `${meta.title} saved`)
      await loadData(filters)
      resetForm()
    } catch (e) {
      setError(e?.response?.data?.error || `Failed to save ${getRecordLabel(section)}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row) {
    const label = row.name || row.title || row.recipientName || row.reference || 'record'
    if (!window.confirm(`Delete this ${getRecordLabel(section)}?`)) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (section === 'categories') await deleteInventoryCategory(row._id)
      if (section === 'items') await deleteInventoryItem(row._id)
      if (section === 'stock') await deleteInventoryStockMovement(row._id)
      if (section === 'distribution') await deleteInventoryDistribution(row._id)
      if (editingId === row._id) resetForm()
      setSuccess(`Deleted ${label}`)
      await loadData(filters)
    } catch (e) {
      setError(e?.response?.data?.error || `Failed to delete ${getRecordLabel(section)}`)
    } finally {
      setSaving(false)
    }
  }

  async function applyFilters() {
    await loadData(filters)
  }

  if (section === 'overview') {
    return (
      <div className="space-y-6">
        <PageHeader title={meta.title} subtitle={meta.subtitle} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { href: '/admin/inventory/categories', title: 'Categories', text: 'Manage category groups for stock items.' },
            { href: '/admin/inventory/items', title: 'Items', text: 'Create and maintain inventory items and quantities.' },
            { href: '/admin/inventory/stock', title: 'Stock', text: 'Record item inflow and outflow movements.' },
            { href: '/admin/inventory/distribution', title: 'Distribution', text: 'Track issued items and recipient details.' }
          ].map((card) => (
            <Card key={card.href} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
              <p className="text-sm text-gray-600">{card.text}</p>
              <Link className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700" href={card.href}>
                Open section
              </Link>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const filterFields = []
  if (section === 'categories') {
    filterFields.push(
      <Input key="q" placeholder="Search categories" value={filters.q || ''} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />,
      <Select key="active" value={filters.active || ''} onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value }))}>
        <option value="">All status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </Select>
    )
  }
  if (section === 'items') {
    filterFields.push(
      <Input key="q" placeholder="Search items" value={filters.q || ''} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />,
      <Select key="categoryId" value={filters.categoryId || ''} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}>
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>{category.name}</option>
        ))}
      </Select>,
      <Select key="status" value={filters.status || ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="damaged">Damaged</option>
      </Select>
    )
  }
  if (section === 'stock') {
    filterFields.push(
      <Input key="q" placeholder="Search stock movements" value={filters.q || ''} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />,
      <Select key="itemId" value={filters.itemId || ''} onChange={(event) => setFilters((current) => ({ ...current, itemId: event.target.value }))}>
        <option value="">All items</option>
        {items.map((item) => (
          <option key={item._id} value={item._id}>{item.name}</option>
        ))}
      </Select>,
      <Select key="movementType" value={filters.movementType || ''} onChange={(event) => setFilters((current) => ({ ...current, movementType: event.target.value }))}>
        <option value="">All types</option>
        <option value="in">In</option>
        <option value="out">Out</option>
      </Select>
    )
  }
  if (section === 'distribution') {
    filterFields.push(
      <Input key="q" placeholder="Search distributions" value={filters.q || ''} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />,
      <Select key="itemId" value={filters.itemId || ''} onChange={(event) => setFilters((current) => ({ ...current, itemId: event.target.value }))}>
        <option value="">All items</option>
        {items.map((item) => (
          <option key={item._id} value={item._id}>{item.name}</option>
        ))}
      </Select>,
      <Select key="recipientType" value={filters.recipientType || ''} onChange={(event) => setFilters((current) => ({ ...current, recipientType: event.target.value }))}>
        <option value="">All recipients</option>
        <option value="class">Class</option>
        <option value="student">Student</option>
        <option value="staff">Staff</option>
        <option value="department">Department</option>
        <option value="other">Other</option>
      </Select>,
      <Select key="status" value={filters.status || ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
        <option value="">All statuses</option>
        <option value="issued">Issued</option>
        <option value="returned">Returned</option>
        <option value="lost">Lost</option>
      </Select>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={meta.title} subtitle={meta.subtitle} />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card>
        <div className={`grid gap-3 ${filterFields.length > 2 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          {filterFields}
          <Button type="button" onClick={applyFilters}>Refresh</Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <h2 className="font-medium">{editingId ? `Edit ${meta.title}` : meta.title}</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            {section === 'categories' ? (
              <>
                <Input placeholder="Category name" value={form.name || ''} onChange={(event) => updateField('name', event.target.value)} required />
                <Textarea placeholder="Description" value={form.description || ''} onChange={(event) => updateField('description', event.target.value)} rows={3} />
                <Select value={String(Boolean(form.active))} onChange={(event) => updateField('active', event.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </>
            ) : null}

            {section === 'items' ? (
              <>
                <Input placeholder="SKU" value={form.sku || ''} onChange={(event) => updateField('sku', event.target.value)} />
                <Input placeholder="Item name" value={form.name || ''} onChange={(event) => updateField('name', event.target.value)} required />
                <Select value={form.categoryId || ''} onChange={(event) => updateField('categoryId', event.target.value)} required>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Unit" value={form.unit || ''} onChange={(event) => updateField('unit', event.target.value)} />
                  <Input type="number" placeholder="Quantity" value={form.quantity || '0'} onChange={(event) => updateField('quantity', event.target.value)} min="0" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Minimum quantity" value={form.minQuantity || '0'} onChange={(event) => updateField('minQuantity', event.target.value)} min="0" />
                  <Select value={form.status || 'active'} onChange={(event) => updateField('status', event.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="damaged">Damaged</option>
                  </Select>
                </div>
                <Input placeholder="Location" value={form.location || ''} onChange={(event) => updateField('location', event.target.value)} />
                <Textarea placeholder="Notes" value={form.notes || ''} onChange={(event) => updateField('notes', event.target.value)} rows={3} />
              </>
            ) : null}

            {section === 'stock' ? (
              <>
                <Select value={form.itemId || ''} onChange={(event) => updateField('itemId', event.target.value)} required>
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.movementType || 'in'} onChange={(event) => updateField('movementType', event.target.value)}>
                    <option value="in">In</option>
                    <option value="out">Out</option>
                  </Select>
                  <Input type="number" placeholder="Quantity" value={form.quantity || '1'} onChange={(event) => updateField('quantity', event.target.value)} min="1" />
                </div>
                <Input type="date" value={form.movementDate || ''} onChange={(event) => updateField('movementDate', event.target.value)} />
                <Input placeholder="Reference" value={form.reference || ''} onChange={(event) => updateField('reference', event.target.value)} />
                <Textarea placeholder="Note" value={form.note || ''} onChange={(event) => updateField('note', event.target.value)} rows={3} />
              </>
            ) : null}

            {section === 'distribution' ? (
              <>
                <Select value={form.itemId || ''} onChange={(event) => updateField('itemId', event.target.value)} required>
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </Select>
                <Input placeholder="Recipient name" value={form.recipientName || ''} onChange={(event) => updateField('recipientName', event.target.value)} required />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.recipientType || 'other'} onChange={(event) => updateField('recipientType', event.target.value)}>
                    <option value="class">Class</option>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="department">Department</option>
                    <option value="other">Other</option>
                  </Select>
                  <Input type="number" placeholder="Quantity" value={form.quantity || '1'} onChange={(event) => updateField('quantity', event.target.value)} min="1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={form.distributedAt || ''} onChange={(event) => updateField('distributedAt', event.target.value)} />
                  <Select value={form.status || 'issued'} onChange={(event) => updateField('status', event.target.value)}>
                    <option value="issued">Issued</option>
                    <option value="returned">Returned</option>
                    <option value="lost">Lost</option>
                  </Select>
                </div>
                <Textarea placeholder="Note" value={form.note || ''} onChange={(event) => updateField('note', event.target.value)} rows={3} />
              </>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : getCreateButtonLabel(section, editingId)}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="font-medium">{meta.title} Records</h2>
          <div className="mt-4 overflow-x-auto">
            {loading ? <Skeleton className="h-56" /> : null}
            {!loading && records.length === 0 ? <div className="text-sm text-gray-600">No {getRecordLabel(section)} records found.</div> : null}
            {!loading && records.length > 0 ? (
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    {section === 'categories' ? <><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Description</th><th className="py-2 pr-4">Status</th></> : null}
                    {section === 'items' ? <><th className="py-2 pr-4">Item</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4">Qty</th><th className="py-2 pr-4">Status</th></> : null}
                    {section === 'stock' ? <><th className="py-2 pr-4">Item</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Quantity</th><th className="py-2 pr-4">Date</th></> : null}
                    {section === 'distribution' ? <><th className="py-2 pr-4">Item</th><th className="py-2 pr-4">Recipient</th><th className="py-2 pr-4">Qty</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Date</th></> : null}
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={row._id} className="border-t border-gray-100">
                      {section === 'categories' ? (
                        <>
                          <td className="py-3 pr-4 font-medium text-gray-900">{row.name}</td>
                          <td className="py-3 pr-4 text-gray-600">{row.description || '-'}</td>
                          <td className="py-3 pr-4 text-gray-600">{row.active ? 'Active' : 'Inactive'}</td>
                        </>
                      ) : null}
                      {section === 'items' ? (
                        <>
                          <td className="py-3 pr-4 font-medium text-gray-900">{row.name}</td>
                          <td className="py-3 pr-4 text-gray-600">{row.category?.name || categoryMap.get(row.category)?.name || '-'}</td>
                          <td className="py-3 pr-4 text-gray-600">{row.quantity ?? 0} {row.unit || ''}</td>
                          <td className="py-3 pr-4 text-gray-600">{row.status}</td>
                        </>
                      ) : null}
                      {section === 'stock' ? (
                        <>
                          <td className="py-3 pr-4 font-medium text-gray-900">{row.item?.name || itemMap.get(row.item)?.name || '-'}</td>
                          <td className="py-3 pr-4 text-gray-600">{row.movementType}</td>
                          <td className="py-3 pr-4 text-gray-600">{row.quantity}</td>
                          <td className="py-3 pr-4 text-gray-600">{formatDate(row.movementDate)}</td>
                        </>
                      ) : null}
                      {section === 'distribution' ? (
                        <>
                          <td className="py-3 pr-4 font-medium text-gray-900">{row.item?.name || itemMap.get(row.item)?.name || '-'}</td>
                          <td className="py-3 pr-4 text-gray-600">{row.recipientName} ({row.recipientType})</td>
                          <td className="py-3 pr-4 text-gray-600">{row.quantity}</td>
                          <td className="py-3 pr-4 text-gray-600">{row.status}</td>
                          <td className="py-3 pr-4 text-gray-600">{formatDate(row.distributedAt)}</td>
                        </>
                      ) : null}
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => populateForm(row)}>Edit</Button>
                          <Button type="button" variant="outline" onClick={() => handleDelete(row)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
