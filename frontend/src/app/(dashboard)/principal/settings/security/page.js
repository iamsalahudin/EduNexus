"use client"

import { useState } from 'react'
import { authService } from '@/services/auth.service'

export default function PrincipalSecuritySettings() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await authService.changePassword({ oldPassword, newPassword })
      setSuccess('Password updated successfully')
      setOldPassword('')
      setNewPassword('')
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.response?.data?.message || e2?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="text-sm text-gray-600 mt-1">Change your account password.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Old password</label>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full" />
        </div>

        {error ? <div className="text-red-500 text-sm">{error}</div> : null}
        {success ? <div className="text-green-600 text-sm">{success}</div> : null}

        <button type="submit" className="px-3 py-2 btn-primary rounded" disabled={loading}>
          {loading ? 'Saving...' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
