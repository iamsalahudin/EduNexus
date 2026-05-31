"use client"

import { useState } from 'react'
import { authService } from '@/services/auth.service'
import { Button, Card, Input, PageHeader } from '@/components/ui'

export default function SecuritySettings() {
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

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <Input
            label="Old password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />

        {error ? <div className="text-red-500 text-sm">{error}</div> : null}
        {success ? <div className="text-green-600 text-sm">{success}</div> : null}

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Update password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
