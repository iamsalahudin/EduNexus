"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SubHeader from '@/components/layout/SubHeader'
import Skeleton from '@/components/ui/Skeleton'
import { userService } from '@/services/user.service'

const ROLE_OPTIONS = ['Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'HR', 'Finance', 'Reception']

export default function UpdateUser() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams?.get('id') || ''

  const breadcrumb = useMemo(
    () => [
      { id: 1, name: 'Users', link: '/admin/users' },
      { id: 2, name: 'Update', link: '/admin/users/update' }
    ],
    []
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'Teacher', active: true })

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!id) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const data = await userService.getUser(id)
        const u = data?.user
        if (!mounted) return
        setUser(u)
        setForm({
          name: u?.name || '',
          email: u?.email || '',
          role: u?.role || 'Teacher',
          active: u?.active !== false
        })
      } catch (e) {
        if (mounted) setError(e?.response?.data?.error || e?.message || 'Failed to load user')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    setError('')
    try {
      await userService.updateUser(id, {
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active
      })
      router.push(`/admin/users/user/${encodeURIComponent(id)}`)
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <SubHeader breadcrumb={breadcrumb} />

      <div>
        <h1 className="text-2xl font-semibold">Update User</h1>
        <p className="text-sm text-gray-600 mt-1">Edit user profile fields (Admin-only).</p>
      </div>

      {!id ? (
        <div className="card">
          <div className="text-sm">Missing user id.</div>
          <div className="mt-2">
            <button className="px-3 py-2 border rounded hover-theme-primary" onClick={() => router.push('/admin/users')}>Back to Users</button>
          </div>
        </div>
      ) : loading ? (
        <div className="card"><Skeleton className="h-40" /></div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 max-w-2xl">
          <div className="text-sm text-gray-600">User ID: {user?._id || id}</div>

          <div>
            <label className="block text-sm mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full" />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full" />
          </div>

          <div>
            <label className="block text-sm mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="w-full">
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
            Active
          </label>

          {error ? <div className="text-red-500 text-sm">{error}</div> : null}

          <div className="flex gap-2">
            <button type="button" className="px-3 py-2 border rounded hover-theme-primary" onClick={() => router.push(`/admin/users/user/${encodeURIComponent(id)}`)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="px-3 py-2 btn-primary rounded" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
