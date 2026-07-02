'use client'

import { useEffect, useState } from 'react'
import complaintService from '@/services/complaint.service'
import authService from '@/services/auth.service'
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
} from '@/components/ui'

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'academic', label: 'Academic' },
  { value: 'discipline', label: 'Discipline' },
  { value: 'behavior', label: 'Behavior' },
  { value: 'transport', label: 'Transport' },
  { value: 'fees', label: 'Fees' },
  { value: 'other', label: 'Other' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export default function StudentComplaintsPage() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('submit') // 'submit' or 'history'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Submit form state
  const [submitForm, setSubmitForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)

  // History state
  const [complaints, setComplaints] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
  })
  const [editError, setEditError] = useState(null)
  const [editSaving, setEditSaving] = useState(false)

  // Load current user
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

  // Load complaints when tab changes to history
  useEffect(() => {
    if (tab === 'history' && complaints.length === 0) {
      loadComplaints()
    }
  }, [tab])

  const loadComplaints = async () => {
    setHistoryLoading(true)
    try {
      const res = await complaintService.getComplaints({ limit: 100 })
      // Filter to only student's own complaints
      setComplaints(res.complaints || [])
    } catch (err) {
      setError(err.message || 'Failed to load complaints')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Handle submit complaint
  const handleSubmitComplaint = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)
    setSubmitting(true)

    // Validation
    if (!submitForm.title.trim()) {
      setSubmitError('Title is required')
      setSubmitting(false)
      return
    }
    if (!submitForm.description.trim()) {
      setSubmitError('Description is required')
      setSubmitting(false)
      return
    }

    try {
      const response = await complaintService.submitComplaint({
        title: submitForm.title,
        description: submitForm.description,
        category: submitForm.category,
        priority: submitForm.priority,
      })

      setSubmitSuccess('Complaint submitted successfully')
      setSubmitForm({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
      })

      // Auto-refresh history
      setTimeout(() => {
        loadComplaints()
      }, 1500)
    } catch (err) {
      setSubmitError(err?.response?.data?.error || err.message || 'Failed to submit complaint')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit complaint
  const handleEditComplaint = (complaint) => {
    setEditingId(complaint._id)
    setEditForm({
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
    })
    setEditError(null)
  }

  const handleSaveEdit = async () => {
    setEditError(null)
    setEditSaving(true)

    if (!editForm.title.trim()) {
      setEditError('Title is required')
      setEditSaving(false)
      return
    }
    if (!editForm.description.trim()) {
      setEditError('Description is required')
      setEditSaving(false)
      return
    }

    try {
      await complaintService.editComplaint(editingId, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        priority: editForm.priority,
      })

      // Update the complaint in the list
      setComplaints(
        complaints.map((c) =>
          c._id === editingId
            ? {
                ...c,
                title: editForm.title,
                description: editForm.description,
                category: editForm.category,
                priority: editForm.priority,
              }
            : c
        )
      )

      setEditingId(null)
      setSelectedComplaint(null)
      await loadComplaints()
    } catch (err) {
      setEditError(err?.response?.data?.error || err.message || 'Failed to update complaint')
    } finally {
      setEditSaving(false)
    }
  }

  // Handle add comment
  const handleAddComment = async (text) => {
    if (!selectedComplaint) return
    try {
      const response = await complaintService.addComment(selectedComplaint._id, { message: text })
      setSelectedComplaint(response.complaint)
      await loadComplaints()
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  if (loading) return <Skeleton className="h-screen" />
  if (error && !user) return <EmptyState title="Error" description={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        subtitle="Submit complaints and track updates"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('submit')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            tab === 'submit'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Submit Complaint
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            tab === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          My Complaints ({complaints.length})
        </button>
      </div>

      {/* Submit Tab */}
      {tab === 'submit' && (
        <Card>
          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Title *</label>
              <Input
                type="text"
                value={submitForm.title}
                onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                placeholder="Brief title for your complaint"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Category</label>
                <Select
                  value={submitForm.category}
                  onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                  options={CATEGORY_OPTIONS}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Priority</label>
                <Select
                  value={submitForm.priority}
                  onChange={(e) => setSubmitForm({ ...submitForm, priority: e.target.value })}
                  options={PRIORITY_OPTIONS}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Description *</label>
              <Textarea
                value={submitForm.description}
                onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                placeholder="Describe your complaint in detail..."
                rows={5}
                required
              />
            </div>

            {submitError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{submitError}</div>}
            {submitSuccess && <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{submitSuccess}</div>}

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </form>
        </Card>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaints List */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Complaints List</h3>
            {historyLoading ? (
              <Skeleton className="h-40" />
            ) : complaints.length === 0 ? (
              <EmptyState
                title="No complaints yet"
                description="You haven't submitted any complaints yet"
              />
            ) : (
              <div className="space-y-2">
                {complaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    onClick={() => setSelectedComplaint(complaint)}
                    className={`p-3 border rounded cursor-pointer transition ${
                      selectedComplaint?._id === complaint._id
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{complaint.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{complaint.description.substring(0, 50)}...</div>
                      </div>
                      <StatusBadge status={complaint.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Detail Panel */}
          <Card>
            {selectedComplaint ? (
              <div className="space-y-4">
                {editingId === selectedComplaint._id ? (
                  // Edit form
                  <div className="space-y-3">
                    <h4 className="font-semibold">Edit Complaint</h4>
                    <Input
                      type="text"
                      label="Title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                    <Textarea
                      label="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                    />
                    {editError && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{editError}</div>}
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={handleSaveEdit}
                        disabled={editSaving}
                        className="flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Title</div>
                      <div className="font-semibold">{selectedComplaint.title}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Status</div>
                      <StatusBadge status={selectedComplaint.status} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Category</div>
                      <div>{selectedComplaint.category}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Description</div>
                      <div className="text-sm mt-1">{selectedComplaint.description}</div>
                    </div>

                    {/* Edit button - only show if status is 'open' */}
                    {selectedComplaint.status === 'open' && (
                      <Button
                        variant="secondary"
                        onClick={() => handleEditComplaint(selectedComplaint)}
                        className="w-full"
                      >
                        Edit Complaint
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a complaint to view details
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
