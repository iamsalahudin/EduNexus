'use client'

<<<<<<< HEAD
import { useEffect, useState } from 'react'
import complaintCategoryService from '@/services/complaintCategoryService'
import { Button, Card, Input, PageHeader, Skeleton } from '@/components/ui'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', icon: '', active: true })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await complaintCategoryService.listCategories()
      setCategories(Array.isArray(res?.categories) ? res.categories : [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: '', description: '', icon: '', active: true })
    setShowModal(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({ name: row.name || '', description: row.description || '', icon: row.icon || '', active: !!row.active })
    setShowModal(true)
  }

  async function save() {
    try {
      if (editing) {
        await complaintCategoryService.updateCategory(editing._id, form)
      } else {
        await complaintCategoryService.createCategory(form)
      }
      setShowModal(false)
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save category')
    }
  }

  async function remove(id) {
    if (!confirm('Delete this category?')) return
    try {
      await complaintCategoryService.deleteCategory(id)
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to delete category')
    }
  }

  return (
    <div>
      <PageHeader title="Complaint Categories" subtitle="Manage complaint categories" right={<Button onClick={openNew}>Add Category</Button>} />

      {error ? <div className="text-sm text-red-700">{error}</div> : null}

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Active</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id} className="border-b last:border-b-0">
                    <td className="py-2 px-3 font-medium">{c.name}</td>
                    <td className="py-2 px-3">{c.description || '-'}</td>
                    <td className="py-2 px-3">{c.active ? 'Yes' : 'No'}</td>
                    <td className="py-2 px-3">
                      <Button onClick={() => openEdit(c)} variant="outline" size="sm">Edit</Button>
                      <Button onClick={() => remove(c._id)} variant="danger" size="sm" className="ml-2">Delete</Button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-sm text-gray-600">No categories found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{editing ? 'Edit Category' : 'Add Category'}</h3>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          </div>
          <div className="space-y-3 mt-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <Input label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <Input label="Icon" value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={save}>{editing ? 'Save' : 'Create'}</Button>
            </div>
          </div>
        </Card>
      )}
=======
export default function ComplaintCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Complaint Categories</h1>
        <p className="text-gray-600 mt-2">Manage complaint categories</p>
      </div>
      {/* Content will be added here */}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
    </div>
  )
}
