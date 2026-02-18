"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { userService } from '@/services/user.service'

const ROLE_OPTIONS = ['Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'HR', 'Finance', 'Reception']

export default function NewUser() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Teacher'
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
        email: form.email,
        password: form.password,
        role: form.role
      })
      router.push('/admin/users')
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Create New User</h1>
        <p className="text-sm text-gray-600 mt-1">Creates a new account via backend registration.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
            minLength={6}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className="w-full"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {error ? <div className="text-red-500 text-sm">{error}</div> : null}

        <div className="flex gap-2">
          <button type="button" className="px-3 py-2 border rounded hover-theme-primary" onClick={() => router.push('/admin/users')} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="px-3 py-2 btn-primary rounded" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
