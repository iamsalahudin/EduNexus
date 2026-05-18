"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { userService } from '@/services/user.service'
import { Button, Card, Input, PageHeader, Select } from '@/components/ui'

const ROLE_OPTIONS = ['HR', 'Finance', 'Reception']

export default function NewUser() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await userService.createUser({
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role
      })
      router.push('/principal/users')
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Add New User"
        subtitle="Create a user account. For Principal, HR, Finance, and Reception, a welcome credentials email is sent automatically."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />

          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            required
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />

          <Input
            label="Temporary Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
            minLength={6}
          />

          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            required
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>

          {error ? <div className="text-red-500 text-sm">{error}</div> : null}

          <div className="flex gap-2">
            <Button type="button" onClick={() => router.push('/principal/users')} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

