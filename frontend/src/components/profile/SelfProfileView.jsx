'use client'

import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import authService from '@/services/auth.service'

function Field({ label, value }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  )
}

export default function SelfProfileView({ editHref }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadUser() {
      try {
        const data = await authService.me()
        if (mounted) setUser(data?.user || data)
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || err.message || 'Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadUser()
    return () => { mounted = false }
  }, [])

  if (loading) return <Skeleton className="h-96" />
  if (error) return <div className="text-sm text-red-600">{error}</div>
  if (!user) return <div className="text-sm text-gray-600">Profile not found.</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="View your personal information."
        right={editHref ? <ButtonLink href={editHref} variant="primary">Edit Profile</ButtonLink> : null}
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Username" value={user.username} />
          <Field label="Role" value={user.role} />
          <Field label="Phone" value={user.profile?.phone} />
          <Field label="Department" value={user.profile?.department} />
        </div>
      </Card>
    </div>
  )
}
