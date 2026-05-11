'use client'

import { useEffect, useState } from 'react'
import { PageHeader, Card, Skeleton } from '@/components/ui'
import userService from '@/services/user.service'

export default function Page() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadProfile() {
    setLoading(true)
    setError('')
    try {
      const res = await userService.getProfile()
      setProfile(res?.user || null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="View your personal information and role details."
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile?.name?.charAt(0)?.toUpperCase()}
            </div>
            <h2 className="font-medium mt-4">{profile?.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{profile?.email}</p>
            <p className="text-sm text-gray-600">{profile?.phone}</p>
            <div className="mt-4 flex justify-center">
              <span className="px-3 py-1 rounded text-xs font-medium bg-primary text-white">
                {profile?.role || 'Receptionist'}
              </span>
            </div>
          </div>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <h2 className="font-medium mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 font-medium">Full Name</label>
                <p className="text-sm mt-1">{profile?.name || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Email</label>
                <p className="text-sm mt-1">{profile?.email || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Phone</label>
                <p className="text-sm mt-1">{profile?.phone || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Role</label>
                <p className="text-sm mt-1 capitalize">{profile?.role || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Status</label>
                <p className="text-sm mt-1 capitalize">{profile?.status || 'Active'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Member Since</label>
                <p className="text-sm mt-1">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 font-medium">Address</label>
              <p className="text-sm mt-1">{profile?.address || '-'}</p>
            </div>

            <div className="pt-4 border-t">
              <a href="/receptionist/profile/edit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">
                Edit Profile
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
