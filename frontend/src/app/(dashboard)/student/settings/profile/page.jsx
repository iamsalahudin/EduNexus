'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import authService from '@/services/auth.service'
import { Button, Card, PageHeader, Skeleton } from '@/components/ui'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await authService.me()
        setUser(userData)
      } catch (err) {
        setError(err.message || 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  if (loading) return <Skeleton className="h-96" />
  if (error) return <div className="text-red-600">{error}</div>
  if (!user) return <div>User not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="My Profile"
            subtitle="View your personal information"
          />
        </div>
        <Link href="/student/settings/profile/edit">
          <Button variant="primary">Edit Profile</Button>
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <p className="text-lg font-semibold mt-1">{user.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <p className="text-lg font-semibold mt-1">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Username</label>
            <p className="text-lg font-semibold mt-1">{user.username}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Role</label>
            <p className="text-lg font-semibold mt-1">{user.role}</p>
          </div>
          {user.profile?.phone && (
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p className="text-lg font-semibold mt-1">{user.profile.phone}</p>
            </div>
          )}
          {user.class && (
            <div>
              <label className="text-sm font-medium text-gray-600">Class</label>
              <p className="text-lg font-semibold mt-1">{user.class} {user.section ? `- ${user.section}` : ''}</p>
            </div>
          )}
          {user.rollNo && (
            <div>
              <label className="text-sm font-medium text-gray-600">Roll Number</label>
              <p className="text-lg font-semibold mt-1">{user.rollNo}</p>
            </div>
          )}
          {user.admissionDate && (
            <div>
              <label className="text-sm font-medium text-gray-600">Admission Date</label>
              <p className="text-lg font-semibold mt-1">{new Date(user.admissionDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
