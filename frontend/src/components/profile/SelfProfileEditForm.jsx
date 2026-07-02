'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, PageHeader, Skeleton } from '@/components/ui'
import authService from '@/services/auth.service'

export default function SelfProfileEditForm({ profileHref }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    let mounted = true
    async function loadUser() {
      try {
        const data = await authService.me()
        const user = data?.user || data
        if (mounted && user) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.profile?.phone || '',
          })
        }
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || err.message || 'Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadUser()
    return () => { mounted = false }
  }, [])

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim()) return setError('Name is required')
    if (!formData.email.trim()) return setError('Email is required')
    if (!formData.email.includes('@')) return setError('Please enter a valid email')

    setSaving(true)
    try {
      await authService.updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      })
      setSuccess('Profile updated successfully')
      setTimeout(() => {
        if (profileHref) router.push(profileHref)
        else router.back()
      }, 1200)
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Profile" subtitle="Update your personal information." />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="text-sm font-medium block mb-2">Name *</label>
            <Input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Your name" required />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Email *</label>
            <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="your.email@example.com" required />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Phone (optional)</label>
            <Input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+92 300 1234567" />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
            <p>Username and Role cannot be changed.</p>
          </div>

          {error ? <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div> : null}
          {success ? <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{success}</div> : null}

          <div className="flex gap-2 pt-4">
            <Button type="submit" variant="primary" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
