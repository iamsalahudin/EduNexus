"use client"

import { useState } from 'react'
import { authService } from '@/services/auth.service'
import { Button, Card, Input, PageHeader } from '@/components/ui'

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
      <PageHeader title="Security" subtitle="Change your account password." />

      <form onSubmit={handleSubmit} className="max-w-xl">
        <Card className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Old password</label>
          <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">New password</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
        </div>

        {error ? <div className="text-red-500 text-sm">{error}</div> : null}
        {success ? <div className="text-green-600 text-sm">{success}</div> : null}

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : 'Update password'}
        </Button>
        </Card>
      </form>
    </div>
  )
}
