'use client'

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Skeleton, Textarea } from '@/components/ui'
import employeeService from '@/services/employeeService'

const INITIAL_FORM = { name: '', description: '', active: true }

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadDepartments()
  }, [])

  async function loadDepartments() {
    setLoading(true)
    setError('')
    try {
      const res = await employeeService.listDepartments({ includeInactive: true })
      setDepartments(Array.isArray(res?.departments) ? res.departments : [])
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Unable to load departments.')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(department) {
    setEditingId(department._id || department.id)
    setForm({
      name: department.name || '',
      description: department.description || '',
      active: Boolean(department.active)
    })
  }

  function resetForm() {
    setEditingId('')
    setForm(INITIAL_FORM)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!String(form.name || '').trim()) {
      setError('Department name is required.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        active: Boolean(form.active)
      }

      if (editingId) {
        await employeeService.updateDepartment(editingId, payload)
        setSuccess('Department updated successfully.')
      } else {
        await employeeService.createDepartment(payload)
        setSuccess('Department created successfully.')
      }

      resetForm()
      await loadDepartments()
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Unable to save department.')
    } finally {
      setSaving(false)
    }
  }

  async function removeDepartment(id) {
    if (!confirm('Delete this department?')) return
    setError('')
    setSuccess('')
    try {
      await employeeService.deleteDepartment(id)
      setSuccess('Department deleted successfully.')
      if (editingId === id) resetForm()
      await loadDepartments()
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Unable to delete department.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Create and maintain employee departments."
        right={<ButtonLink href="/admin/employees" variant="secondary">Employees</ButtonLink>}
      />

      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Department' : 'Add Department'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Department Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Administration"
              disabled={saving}
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Short department description"
              rows={4}
              disabled={saving}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={String(form.active)}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.value === 'true' }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                disabled={saving}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={saving} className="flex-1">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Department List</h3>
          {loading ? (
            <Skeleton className="h-72" />
          ) : departments.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-600">No departments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-semibold">Name</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                    <th className="p-3 text-left font-semibold">Description</th>
                    <th className="p-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((department) => (
                    <tr key={department._id || department.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{department.name}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${department.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {department.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{department.description || '-'}</td>
                      <td className="p-3 text-right space-x-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(department)}>
                          Edit
                        </Button>
                        <Button type="button" variant="danger" size="sm" onClick={() => removeDepartment(department._id || department.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
