'use client'

import { useEffect, useState } from 'react'
import complaintCategoryService from '@/services/complaintCategoryService'
import { Button, PageHeader } from '@/components/ui'
import ComplaintCategoriesTableCard from '@/components/complaints/ComplaintCategoriesTableCard'
import ComplaintCategoryFormCard from '@/components/complaints/ComplaintCategoryFormCard'

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

  function updateFormField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
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

      <ComplaintCategoriesTableCard
        categories={categories}
        loading={loading}
        onEdit={openEdit}
        onDelete={remove}
      />

      {showModal && (
        <ComplaintCategoryFormCard
          editing={editing}
          form={form}
          onChange={updateFormField}
          onClose={() => setShowModal(false)}
          onSave={save}
        />
      )}
    </div>
  )
}
