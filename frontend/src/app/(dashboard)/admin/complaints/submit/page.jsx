'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import complaintService from '@/services/complaint.service'
import complaintCategoryService from '@/services/complaintCategoryService'

export default function SubmitComplaintPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    attachmentFile: null
  })

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setCategoriesLoading(true)
    try {
      const res = await complaintCategoryService.listCategories()
      setCategories(Array.isArray(res?.categories) ? res.categories : [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load categories')
    } finally {
      setCategoriesLoading(false)
    }
  }

  function validateForm() {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    if (!formData.description.trim()) {
      setError('Description is required')
      return false
    }
    if (!formData.category.trim()) {
      setError('Category is required')
      return false
    }
    if (formData.title.length > 200) {
      setError('Title must be less than 200 characters')
      return false
    }
    if (formData.description.length > 5000) {
      setError('Description must be less than 5000 characters')
      return false
    }
    return true
  }

  async function handleSubmit(e) {
    console.log('Submitting complaint with data:', formData)
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setLoading(true)
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority
      }

      // If there's a file, handle file upload separately (optional)
      // For now, we'll submit just the complaint data
      const res = await complaintService.submitComplaint(payload)
      
      setSuccess('Complaint submitted successfully!')
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/complaints')
      }, 2000)
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e.message || 'Failed to submit complaint'
      setError(errorMsg)
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Submit Complaint"
        subtitle="File a new complaint. Our team will review and respond within 48 hours."
      />

      {error && (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      )}

      {success && (
        <Card className="mt-6 bg-green-50 border border-green-200">
          <div className="text-sm text-green-700">{success}</div>
        </Card>
      )}

      <Card className="mt-6">
        <h3 className="text-lg font-semibold mb-6">Complaint Form</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-600">*</span></label>
            {categoriesLoading ? (
              <Skeleton className="h-10" />
            ) : (
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject/Title <span className="text-red-600">*</span></label>
            <Input
              type="text"
              placeholder="Brief title of your complaint"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              maxLength={200}
              disabled={loading}
            />
            <div className="text-xs text-gray-500 mt-1">{formData.title.length}/200</div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-600">*</span></label>
            <textarea
              placeholder="Provide detailed information about your complaint..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              maxLength={5000}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 mt-1">{formData.description.length}/5000</div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (Optional)</label>
            <input
              type="file"
              onChange={(e) => setFormData((prev) => ({ ...prev, attachmentFile: e.target.files?.[0] || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              accept="image/*,.pdf,.doc,.docx"
            />
            <div className="text-xs text-gray-500 mt-1">Supported: Images, PDF, DOC, DOCX (Max 10MB)</div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Info Box */}
      <Card className="my-6 bg-blue-500/20 border border-blue-500">
        <div className="text-sm text-[var(--color-text)]">
          <p className="font-medium mb-2">What happens next?</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Your complaint will be reviewed by our team</li>
            <li>You will receive updates via email</li>
            <li>We aim to respond within 48 hours</li>
            <li>Track your complaint status in your dashboard</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
