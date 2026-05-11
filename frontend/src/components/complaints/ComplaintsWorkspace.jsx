<<<<<<< HEAD
'use client'

import { useEffect, useMemo, useState } from 'react'
import complaintService from '@/services/complaint.service'
import directoryService from '@/services/directoryService'

const STATUS_OPTIONS = ['open', 'assigned', 'in_progress', 'resolved', 'closed']
const CATEGORY_OPTIONS = ['general', 'academic', 'discipline', 'behavior', 'transport', 'fees', 'other']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

function statusBadgeClass(status) {
  if (status === 'resolved') return 'bg-green-100 text-green-700'
  if (status === 'closed') return 'bg-gray-200 text-gray-700'
  if (status === 'in_progress') return 'bg-blue-100 text-blue-700'
  if (status === 'assigned') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function ComplaintsWorkspace({
  title,
  subtitle,
  allowCreate = false,
  allowAssign = false,
  allowStatus = false,
  showOnlyAssigned = false,
  defaultStatus = ''
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasPrev: false, hasNext: false })

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState(defaultStatus || '')
  const [page, setPage] = useState(1)

  const [assignees, setAssignees] = useState([])
  const [busyId, setBusyId] = useState('')
  const [commentDrafts, setCommentDrafts] = useState({})
  const [statusDrafts, setStatusDrafts] = useState({})
  const [assigneeDrafts, setAssigneeDrafts] = useState({})

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    relatedToStudent: ''
  })

  const visibleRows = useMemo(() => {
    if (!showOnlyAssigned) return rows
    return rows.filter((item) => String(item?.assignedTo?._id || '') !== '')
  }, [rows, showOnlyAssigned])

  async function load(nextPage = page) {
    setLoading(true)
    setError('')
    try {
      const result = await complaintService.listComplaints({
        q: q || undefined,
        status: statusFilter || undefined,
        page: nextPage,
        limit: 15,
        sortOrder: 'desc'
      })

      const list = Array.isArray(result?.complaints) ? result.complaints : []
      setRows(list)
      setPagination(result?.pagination || { page: nextPage, totalPages: 1, hasPrev: false, hasNext: false })
      setPage(nextPage)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  async function loadAssignees() {
    if (!allowAssign) return
    try {
      const roles = ['Teacher', 'HR', 'Reception', 'Finance', 'Warden']
      const responses = await Promise.allSettled(roles.map((role) => directoryService.listUsers({ role, limit: 100 })))
      const merged = []
      for (const result of responses) {
        if (result.status !== 'fulfilled') continue
        const users = Array.isArray(result.value?.users) ? result.value.users : []
        for (const user of users) {
          if (!user?._id) continue
          merged.push({
            _id: user._id,
            name: user.name || user.username || user.email || user._id,
            role: user.role || ''
          })
        }
      }
      const unique = []
      const seen = new Set()
      for (const user of merged) {
        if (seen.has(user._id)) continue
        seen.add(user._id)
        unique.push(user)
      }
      setAssignees(unique)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load assignees')
    }
  }

  useEffect(() => {
    load(1)
    loadAssignees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmitComplaint(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await complaintService.createComplaint({
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        relatedToStudent: form.relatedToStudent || undefined
      })
      setSuccess('Complaint submitted successfully.')
      setForm({ title: '', description: '', category: 'general', priority: 'medium', relatedToStudent: '' })
      await load(1)
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to submit complaint')
    }
  }

  async function onAssign(complaintId) {
    const userId = assigneeDrafts[complaintId]
    if (!userId) return

    setBusyId(complaintId)
    setError('')
    setSuccess('')
    try {
      await complaintService.assignComplaint(complaintId, userId)
      setSuccess('Complaint assigned.')
      await load(page)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to assign complaint')
    } finally {
      setBusyId('')
    }
  }

  async function onStatusChange(complaintId) {
    const status = statusDrafts[complaintId]
    if (!status) return

    setBusyId(complaintId)
    setError('')
    setSuccess('')
    try {
      await complaintService.changeStatus(complaintId, status)
      setSuccess('Complaint status updated.')
      await load(page)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update status')
    } finally {
      setBusyId('')
    }
  }

  async function onAddComment(complaintId) {
    const message = String(commentDrafts[complaintId] || '').trim()
    if (!message) return

    setBusyId(complaintId)
    setError('')
    setSuccess('')
    try {
      await complaintService.addComment(complaintId, message)
      setCommentDrafts((prev) => ({ ...prev, [complaintId]: '' }))
      setSuccess('Comment posted.')
      await load(page)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add comment')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      {allowCreate ? (
        <form className="border rounded-lg p-4 bg-white space-y-3" onSubmit={onSubmitComplaint}>
          <div className="font-medium">Submit Complaint</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Related Student ID (optional)"
              value={form.relatedToStudent}
              onChange={(e) => setForm((prev) => ({ ...prev, relatedToStudent: e.target.value }))}
            />
            <select
              className="border rounded px-3 py-2"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select
              className="border rounded px-3 py-2"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            >
              {PRIORITY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <textarea
            className="border rounded px-3 py-2 w-full"
            rows={4}
            placeholder="Describe the issue"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            required
          />
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Submit</button>
        </form>
      ) : null}

      <div className="border rounded-lg p-4 bg-white space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="border rounded px-3 py-2 flex-1 min-w-[220px]"
            placeholder="Search complaints"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="px-3 py-2 border rounded" onClick={() => load(1)} disabled={loading}>Apply</button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Loading complaints...</div>
        ) : visibleRows.length === 0 ? (
          <div className="text-sm text-gray-600">No complaints found.</div>
        ) : (
          <div className="space-y-4">
            {visibleRows.map((complaint) => {
              const cid = complaint?._id
              const comments = Array.isArray(complaint?.comments) ? complaint.comments : []
              return (
                <div key={cid} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{complaint?.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{complaint?.description}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        Category: {complaint?.category || '-'} | Priority: {complaint?.priority || '-'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created by: {complaint?.createdBy?.name || '-'} | Assigned to: {complaint?.assignedTo?.name || 'Unassigned'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${statusBadgeClass(complaint?.status)}`}>
                      {complaint?.status || 'open'}
                    </span>
                  </div>

                  {allowAssign ? (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <select
                        className="border rounded px-3 py-2"
                        value={assigneeDrafts[cid] || ''}
                        onChange={(e) => setAssigneeDrafts((prev) => ({ ...prev, [cid]: e.target.value }))}
                      >
                        <option value="">Assign to...</option>
                        {assignees.map((u) => (
                          <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                      <button
                        className="px-3 py-2 border rounded"
                        onClick={() => onAssign(cid)}
                        disabled={busyId === cid}
                      >
                        Assign
                      </button>
                    </div>
                  ) : null}

                  {allowStatus ? (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <select
                        className="border rounded px-3 py-2"
                        value={statusDrafts[cid] || complaint?.status || 'open'}
                        onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [cid]: e.target.value }))}
                      >
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <button
                        className="px-3 py-2 border rounded"
                        onClick={() => onStatusChange(cid)}
                        disabled={busyId === cid}
                      >
                        Update Status
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <div className="text-xs font-medium mb-2">Comments</div>
                    <div className="space-y-2">
                      {comments.map((c, idx) => (
                        <div key={`${cid}-${idx}`} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="font-medium">{c?.author?.name || 'Unknown'}</div>
                          <div className="mt-1">{c?.message || '-'}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        className="border rounded px-3 py-2 flex-1"
                        placeholder="Write a response"
                        value={commentDrafts[cid] || ''}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [cid]: e.target.value }))}
                      />
                      <button
                        className="px-3 py-2 border rounded"
                        onClick={() => onAddComment(cid)}
                        disabled={busyId === cid}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-2 items-center justify-end text-sm">
          <button className="px-3 py-1 border rounded" onClick={() => load(page - 1)} disabled={!pagination?.hasPrev || loading}>Prev</button>
          <span>Page {pagination?.page || 1} / {pagination?.totalPages || 1}</span>
          <button className="px-3 py-1 border rounded" onClick={() => load(page + 1)} disabled={!pagination?.hasNext || loading}>Next</button>
        </div>
      </div>
    </div>
  )
}
=======
'use client'

import { useEffect, useMemo, useState } from 'react'
import complaintService from '@/services/complaint.service'
import directoryService from '@/services/directoryService'

const STATUS_OPTIONS = ['open', 'assigned', 'in_progress', 'resolved', 'closed']
const CATEGORY_OPTIONS = ['general', 'academic', 'discipline', 'behavior', 'transport', 'fees', 'other']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

function statusBadgeClass(status) {
  if (status === 'resolved') return 'bg-green-100 text-green-700'
  if (status === 'closed') return 'bg-gray-200 text-gray-700'
  if (status === 'in_progress') return 'bg-blue-100 text-blue-700'
  if (status === 'assigned') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function ComplaintsWorkspace({
  title,
  subtitle,
  allowCreate = false,
  allowAssign = false,
  allowStatus = false,
  showOnlyAssigned = false,
  defaultStatus = ''
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasPrev: false, hasNext: false })

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState(defaultStatus || '')
  const [page, setPage] = useState(1)

  const [assignees, setAssignees] = useState([])
  const [busyId, setBusyId] = useState('')
  const [commentDrafts, setCommentDrafts] = useState({})
  const [statusDrafts, setStatusDrafts] = useState({})
  const [assigneeDrafts, setAssigneeDrafts] = useState({})

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    relatedToStudent: ''
  })

  const visibleRows = useMemo(() => {
    if (!showOnlyAssigned) return rows
    return rows.filter((item) => String(item?.assignedTo?._id || '') !== '')
  }, [rows, showOnlyAssigned])

  async function load(nextPage = page) {
    setLoading(true)
    setError('')
    try {
      const result = await complaintService.listComplaints({
        q: q || undefined,
        status: statusFilter || undefined,
        page: nextPage,
        limit: 15,
        sortOrder: 'desc'
      })

      const list = Array.isArray(result?.complaints) ? result.complaints : []
      setRows(list)
      setPagination(result?.pagination || { page: nextPage, totalPages: 1, hasPrev: false, hasNext: false })
      setPage(nextPage)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  async function loadAssignees() {
    if (!allowAssign) return
    try {
      const roles = ['Teacher', 'HR', 'Reception', 'Finance', 'Warden']
      const responses = await Promise.allSettled(roles.map((role) => directoryService.listUsers({ role, limit: 100 })))
      const merged = []
      for (const result of responses) {
        if (result.status !== 'fulfilled') continue
        const users = Array.isArray(result.value?.users) ? result.value.users : []
        for (const user of users) {
          if (!user?._id) continue
          merged.push({
            _id: user._id,
            name: user.name || user.username || user.email || user._id,
            role: user.role || ''
          })
        }
      }
      const unique = []
      const seen = new Set()
      for (const user of merged) {
        if (seen.has(user._id)) continue
        seen.add(user._id)
        unique.push(user)
      }
      setAssignees(unique)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load assignees')
    }
  }

  useEffect(() => {
    load(1)
    loadAssignees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmitComplaint(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await complaintService.createComplaint({
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        relatedToStudent: form.relatedToStudent || undefined
      })
      setSuccess('Complaint submitted successfully.')
      setForm({ title: '', description: '', category: 'general', priority: 'medium', relatedToStudent: '' })
      await load(1)
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to submit complaint')
    }
  }

  async function onAssign(complaintId) {
    const userId = assigneeDrafts[complaintId]
    if (!userId) return

    setBusyId(complaintId)
    setError('')
    setSuccess('')
    try {
      await complaintService.assignComplaint(complaintId, userId)
      setSuccess('Complaint assigned.')
      await load(page)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to assign complaint')
    } finally {
      setBusyId('')
    }
  }

  async function onStatusChange(complaintId) {
    const status = statusDrafts[complaintId]
    if (!status) return

    setBusyId(complaintId)
    setError('')
    setSuccess('')
    try {
      await complaintService.changeStatus(complaintId, status)
      setSuccess('Complaint status updated.')
      await load(page)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update status')
    } finally {
      setBusyId('')
    }
  }

  async function onAddComment(complaintId) {
    const message = String(commentDrafts[complaintId] || '').trim()
    if (!message) return

    setBusyId(complaintId)
    setError('')
    setSuccess('')
    try {
      await complaintService.addComment(complaintId, message)
      setCommentDrafts((prev) => ({ ...prev, [complaintId]: '' }))
      setSuccess('Comment posted.')
      await load(page)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add comment')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      {allowCreate ? (
        <form className="border rounded-lg p-4 bg-white space-y-3" onSubmit={onSubmitComplaint}>
          <div className="font-medium">Submit Complaint</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Related Student ID (optional)"
              value={form.relatedToStudent}
              onChange={(e) => setForm((prev) => ({ ...prev, relatedToStudent: e.target.value }))}
            />
            <select
              className="border rounded px-3 py-2"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select
              className="border rounded px-3 py-2"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            >
              {PRIORITY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <textarea
            className="border rounded px-3 py-2 w-full"
            rows={4}
            placeholder="Describe the issue"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            required
          />
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Submit</button>
        </form>
      ) : null}

      <div className="border rounded-lg p-4 bg-white space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="border rounded px-3 py-2 flex-1 min-w-[220px]"
            placeholder="Search complaints"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="px-3 py-2 border rounded" onClick={() => load(1)} disabled={loading}>Apply</button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Loading complaints...</div>
        ) : visibleRows.length === 0 ? (
          <div className="text-sm text-gray-600">No complaints found.</div>
        ) : (
          <div className="space-y-4">
            {visibleRows.map((complaint) => {
              const cid = complaint?._id
              const comments = Array.isArray(complaint?.comments) ? complaint.comments : []
              return (
                <div key={cid} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{complaint?.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{complaint?.description}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        Category: {complaint?.category || '-'} | Priority: {complaint?.priority || '-'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created by: {complaint?.createdBy?.name || '-'} | Assigned to: {complaint?.assignedTo?.name || 'Unassigned'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${statusBadgeClass(complaint?.status)}`}>
                      {complaint?.status || 'open'}
                    </span>
                  </div>

                  {allowAssign ? (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <select
                        className="border rounded px-3 py-2"
                        value={assigneeDrafts[cid] || ''}
                        onChange={(e) => setAssigneeDrafts((prev) => ({ ...prev, [cid]: e.target.value }))}
                      >
                        <option value="">Assign to...</option>
                        {assignees.map((u) => (
                          <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                      <button
                        className="px-3 py-2 border rounded"
                        onClick={() => onAssign(cid)}
                        disabled={busyId === cid}
                      >
                        Assign
                      </button>
                    </div>
                  ) : null}

                  {allowStatus ? (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <select
                        className="border rounded px-3 py-2"
                        value={statusDrafts[cid] || complaint?.status || 'open'}
                        onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [cid]: e.target.value }))}
                      >
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <button
                        className="px-3 py-2 border rounded"
                        onClick={() => onStatusChange(cid)}
                        disabled={busyId === cid}
                      >
                        Update Status
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <div className="text-xs font-medium mb-2">Comments</div>
                    <div className="space-y-2">
                      {comments.map((c, idx) => (
                        <div key={`${cid}-${idx}`} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="font-medium">{c?.author?.name || 'Unknown'}</div>
                          <div className="mt-1">{c?.message || '-'}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        className="border rounded px-3 py-2 flex-1"
                        placeholder="Write a response"
                        value={commentDrafts[cid] || ''}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [cid]: e.target.value }))}
                      />
                      <button
                        className="px-3 py-2 border rounded"
                        onClick={() => onAddComment(cid)}
                        disabled={busyId === cid}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-2 items-center justify-end text-sm">
          <button className="px-3 py-1 border rounded" onClick={() => load(page - 1)} disabled={!pagination?.hasPrev || loading}>Prev</button>
          <span>Page {pagination?.page || 1} / {pagination?.totalPages || 1}</span>
          <button className="px-3 py-1 border rounded" onClick={() => load(page + 1)} disabled={!pagination?.hasNext || loading}>Next</button>
        </div>
      </div>
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
