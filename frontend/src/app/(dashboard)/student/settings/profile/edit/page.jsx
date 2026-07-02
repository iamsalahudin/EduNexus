'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import { Button, Card, Input, PageHeader, Skeleton } from '@/components/ui'

export default function EditProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await authService.me()
        setUser(userData)
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.profile?.phone || '',
        })
      } catch (err) {
        setError(err.message || 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    // Client-side validation
    if (!formData.name.trim()) {
      setError('Name is required')
      setSaving(false)
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      setSaving(false)
      return
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email')
      setSaving(false)
      return
    }

    try {
      // This will call the new PATCH /auth/profile endpoint
      const response = await authService.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      })

      setUser(response)
      setSuccess('Profile updated successfully')
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/student/settings/profile')
      }, 1500)
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />
  if (!user) return <div>User not found</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Profile"
        subtitle="Update your personal information"
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="text-sm font-medium block mb-2">Name *</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Phone (optional)</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+92 300 1234567"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
            <p>💡 Username and Role cannot be changed</p>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
          {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{success}</div>}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
