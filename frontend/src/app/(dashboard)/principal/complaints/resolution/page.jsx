'use client'

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import complaintService from '@/services/complaint.service'
import directoryService from '@/services/directoryService'
import { COMPLAINT_STATUS_OPTIONS, SYSTEM_ROLES } from '@/utils/constants'

export default function ComplaintResolutionPage() {
  const [complaints, setComplaints] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [commentText, setCommentText] = useState('')
  
  // Form state for resolution
  const [resStatus, setResStatus] = useState('')
  const [resAssignee, setResAssignee] = useState('')
  const [notes, setNotes] = useState('')

  // Load complaints and staff on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      // Load pending complaints
      const complaintRes = await complaintService.listComplaints({
        status: 'open,in_progress',
        limit: 100,
        sortOrder: 'desc'
      })
      const complaintList = Array.isArray(complaintRes?.complaints) ? complaintRes.complaints : []
      setComplaints(complaintList)

      // Load staff for assignment
      const responses = await Promise.allSettled(
        SYSTEM_ROLES.map((role) => directoryService.listUsers({ role, limit: 100 }))
      )
      const staffList = []
      for (const result of responses) {
        if (result.status !== 'fulfilled') continue
        const users = Array.isArray(result.value?.users) ? result.value.users : []
        for (const user of users) {
          if (!user?._id) continue
          staffList.push({
            _id: user._id,
            name: user.name || user.username || user.email || user._id,
            role: user.role || ''
          })
        }
      }
      // Remove duplicates
      const uniqueStaff = []
      const seen = new Set()
      for (const s of staffList) {
        if (seen.has(String(s._id))) continue
        seen.add(String(s._id))
        uniqueStaff.push(s)
      }
      setStaff(uniqueStaff)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  function selectComplaint(complaint) {
    setSelectedComplaint(complaint)
    setResStatus(complaint?.status || 'open')
    setResAssignee(complaint?.assignedTo?._id || '')
    setNotes('')
    setCommentText('')
    setError('')
    setSuccess('')
  }

  async function addComment() {
    if (!selectedComplaint || !commentText.trim()) return
    setError('')
    try {
      await complaintService.addComment(selectedComplaint._id, commentText)
      setCommentText('')
      // Reload complaint to show new comment
      const updated = await complaintService.getComplaint(selectedComplaint._id)
      selectComplaint(updated.complaint)
      setSuccess('Comment added successfully')
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to add comment')
    }
  }

  async function assignComplaint() {
    if (!selectedComplaint || !resAssignee) return
    setSaving(true)
    setError('')
    try {
      await complaintService.assignComplaint(selectedComplaint._id, resAssignee)
      const updated = await complaintService.getComplaint(selectedComplaint._id)
      selectComplaint(updated.complaint)
      await loadData()
      setSuccess('Complaint assigned successfully')
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to assign complaint')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus() {
    if (!selectedComplaint || !resStatus) return
    setSaving(true)
    setError('')
    try {
      await complaintService.changeStatus(selectedComplaint._id, resStatus)
      const updated = await complaintService.getComplaint(selectedComplaint._id)
      selectComplaint(updated.complaint)
      await loadData()
      setSuccess('Status updated successfully')
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const submitterName = selectedComplaint?.submittedBy?.name || selectedComplaint?.submittedBy?.username || 'Unknown'
  const submittedDate = selectedComplaint?.createdAt ? new Date(selectedComplaint.createdAt).toLocaleString() : '-'
  const assigneeName = selectedComplaint?.assignedTo?.name || selectedComplaint?.assignedTo?.username || 'Unassigned'
  const comments = Array.isArray(selectedComplaint?.comments) ? selectedComplaint.comments : []

  return (
    <div>
      <PageHeader
        title="Complaint Resolution"
        subtitle="Manage complaints and track resolution"
        right={<ButtonLink href="/principal/complaints" variant="secondary">Back</ButtonLink>}
      />

      {error && <Card className="mt-6 bg-red-50 border border-red-200"><div className="text-sm text-red-700">{error}</div></Card>}
      {success && <Card className="mt-6 bg-green-50 border border-green-200"><div className="text-sm text-green-700">{success}</div></Card>}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Complaints List */}
        <div>
          <Card>
            <h3 className="font-semibold mb-4">Pending Complaints</h3>
            {loading ? (
              <Skeleton className="h-64" />
            ) : complaints.length === 0 ? (
              <div className="text-sm text-gray-600">No pending complaints.</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {complaints.map((complaint) => (
                  <button
                    key={complaint._id}
                    onClick={() => selectComplaint(complaint)}
                    className={`w-full text-left p-3 rounded border transition ${
                      selectedComplaint?._id === complaint._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{complaint.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {complaint.status && <span className="inline-block px-2 py-1 rounded text-white mr-2" style={{
                        backgroundColor: complaint.status === 'open' ? '#ef4444' : complaint.status === 'in_progress' ? '#3b82f6' : '#10b981'
                      }}>{complaint.status}</span>}
                      By: {submitterName}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Resolution Panel */}
        <div className="lg:col-span-2">
          {!selectedComplaint ? (
            <Card><div className="text-gray-600 text-center py-8">Select a complaint to view details</div></Card>
          ) : (
            <div className="space-y-4">
              {/* Complaint Details */}
              <Card>
                <h3 className="font-semibold mb-4">Complaint Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-gray-600 font-medium">Title</label>
                    <div className="text-gray-900 font-semibold">{selectedComplaint.title}</div>
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Description</label>
                    <div className="text-gray-900 max-h-32 overflow-y-auto">{selectedComplaint.description}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-600 font-medium">Submitted By</label>
                      <div className="text-gray-900">{submitterName}</div>
                    </div>
                    <div>
                      <label className="text-gray-600 font-medium">Date</label>
                      <div className="text-gray-900">{submittedDate}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Category</label>
                    <div className="text-gray-900">{selectedComplaint.category?.name || selectedComplaint.category || '-'}</div>
                  </div>
                </div>
              </Card>

              {/* Resolution Actions */}
              <Card>
                <h3 className="font-semibold mb-4">Resolution</h3>
                <div className="space-y-3">
                  <Select
                    label="Assign To"
                    value={resAssignee}
                    onChange={(e) => setResAssignee(e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Select Staff Member</option>
                    {staff.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={assignComplaint} disabled={!resAssignee || saving} className="flex-1">
                      {saving ? 'Assigning...' : 'Assign'}
                    </Button>
                  </div>

                  <Select
                    label="Status"
                    value={resStatus}
                    onChange={(e) => setResStatus(e.target.value)}
                    disabled={saving}
                  >
                    {COMPLAINT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={changeStatus} disabled={saving} className="flex-1">
                      {saving ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Comments */}
              <Card>
                <h3 className="font-semibold mb-4">Comments</h3>
                <div className="space-y-3">
                  <div>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="Add a comment or note..."
                      rows="3"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      onClick={addComment}
                      disabled={!commentText.trim()}
                      className="mt-2 w-full"
                    >
                      Add Comment
                    </Button>
                  </div>

                  {comments.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                      {comments.map((comment, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                          <div className="font-medium text-xs text-gray-600">
                            {comment.author?.name || 'Unknown'} - {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                          </div>
                          <div className="text-gray-800 mt-1">{comment.message || comment.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
