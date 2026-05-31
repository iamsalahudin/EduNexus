"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { userService } from '@/services/user.service'
import { Button, Card, Input, PageHeader, Select, Skeleton, ToggleBox } from '@/components/ui'

const ROLE_OPTIONS = ['HR', 'Finance', 'Reception']

export default function UpdateUser() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams?.get('id') || ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ name: '', username: '', email: '', role: '', active: true })

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
          username: u?.username || '',
          email: u?.email || '',
          role: u?.role || '',
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
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        active: form.active
      }

      if (ROLE_OPTIONS.includes(form.role)) {
        payload.role = form.role
      }

      await userService.updateUser(id, payload)
      router.push(`/principal/users/user/${encodeURIComponent(id)}`)
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Update User"
        subtitle="Edit account fields. Admin, Teacher, Student, and Parent cannot be assigned from this form."
      />

      {!id ? (
        <Card>
          <div className="text-sm">Missing user id.</div>
          <div className="mt-2">
            <Button type="button" onClick={() => router.push('/principal/users')}>
              Back to Users
            </Button>
          </div>
        </Card>
      ) : loading ? (
        <Card>
          <Skeleton className="h-40" />
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="text-sm text-gray-600">User ID: {user?._id || id}</div>

            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />

            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />

            {ROLE_OPTIONS.includes(form.role) ? (
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="text-sm rounded border p-3 bg-gray-50">
                Current role: <span className="font-medium">{form.role || 'Unknown'}</span>. Role updates are disabled for
                this account from this page.
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <ToggleBox active={form.active} onToggle={(next) => setForm((p) => ({ ...p, active: next }))}>
                Active
              </ToggleBox>
            </div>

            {error ? <div className="text-red-500 text-sm">{error}</div> : null}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => router.push(`/principal/users/user/${encodeURIComponent(id)}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

