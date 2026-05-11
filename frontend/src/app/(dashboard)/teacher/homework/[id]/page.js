<<<<<<< HEAD
﻿"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'
import homeworksService from '@/services/homeworksService'
import InlineFilePreview from '@/components/homework/InlineFilePreview'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

function fmtDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function statusBadge(status) {
  const s = String(status || '')
  const base = 'px-2 py-1 rounded text-xs border'
  if (s === 'submitted') return `${base} border-amber-300 text-amber-800`
  if (s === 'received') return `${base} border-blue-300 text-blue-800`
  if (s === 'returned') return `${base} border-green-300 text-green-800`
  return `${base} border-gray-200 text-gray-700`
}

export default function Page({ params }) {
  const id = params?.id
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [homework, setHomework] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [marks, setMarks] = useState('')
  const [feedback, setFeedback] = useState('')

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await homeworksService.get(id)
      setHomework(res?.homework || null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load homework')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const submissions = useMemo(() => (Array.isArray(homework?.submissions) ? homework.submissions : []), [homework])
  const attachments = useMemo(() => (Array.isArray(homework?.attachments) ? homework.attachments : []), [homework])

  const selectedSubmission = useMemo(() => {
    if (!selectedStudentId) return null
    return submissions.find((s) => String(s?.student?._id || s?.student) === String(selectedStudentId)) || null
  }, [submissions, selectedStudentId])

  useEffect(() => {
    if (!selectedStudentId && submissions.length) {
      const first = submissions[0]
      const sid = first?.student?._id || first?.student
      if (sid) setSelectedStudentId(String(sid))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions.length])

  async function onReceive() {
    if (!selectedSubmission) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await homeworksService.receive(id, { submissionStudentId: selectedStudentId })
      setSuccess('Marked as received')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to mark received')
    } finally {
      setSaving(false)
    }
  }

  async function onReturn() {
    if (!selectedSubmission) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        submissionStudentId: selectedStudentId,
        feedback
      }
      if (homework?.gradingMode === 'marks') {
        payload.marks = Number(marks)
      }
      await homeworksService.returnSubmission(id, payload)
      setSuccess('Returned with feedback')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to return submission')
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteHomework() {
    if (!id || saving) return
    const ok = window.confirm('Delete this homework and all related files/submissions? This action cannot be undone.')
    if (!ok) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await homeworksService.remove(id)
      router.push('/teacher/homework')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete homework')
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Homework Details"
        subtitle="Review student submissions and return feedback."
        right={
          <div className="flex gap-2">
            <Button onClick={load} disabled={loading || saving}>
              Refresh
            </Button>
            <Button onClick={onDeleteHomework} disabled={loading || saving}>
              Delete
            </Button>
            <ButtonLink href="/teacher/homework">Back</ButtonLink>
          </div>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      {loading ? (
        <div className="mt-6"><Skeleton className="h-40" /></div>
      ) : !homework ? (
        <div className="mt-6 text-sm text-gray-600">Not found.</div>
      ) : (
        <>
          <Card className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Title</div>
                <div className="font-medium mt-1">{homework.title}</div>
                <div className="text-sm text-gray-600 mt-2">Class</div>
                <div className="mt-1">{homework.class}-{homework.section}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Subject</div>
                <div className="mt-1">{homework.subjectName || homework?.subject?.name || '—'}</div>
                <div className="text-sm text-gray-600 mt-2">Due</div>
                <div className="mt-1">{fmtDate(homework.dueDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Grading</div>
                <div className="mt-1">{homework.gradingMode === 'marks' ? `Marks (max ${homework.maxMarks ?? homework.totalMarks ?? '—'})` : 'No marks'}</div>
                <div className="text-sm text-gray-600 mt-2">Status</div>
                <div className="mt-1">{homework.status}</div>
              </div>
            </div>
            {homework.description ? (
              <div className="mt-4">
                <div className="text-sm text-gray-600">Description</div>
                <div className="mt-1 whitespace-pre-wrap">{homework.description}</div>
              </div>
            ) : null}
          </Card>

          <Card className="mt-6">
            <h2 className="font-medium">Attachments</h2>
            <div className="mt-3">
              {attachments.length === 0 ? (
                <div className="text-sm text-gray-600">No attachments.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((f) => (
                    <Button
                      key={String(f?.fileId || f?.url)}
                      size="sm"
                      onClick={() => setPreviewFile(f)}
                    >
                      {f?.name || 'Attachment'}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="font-medium">Submissions</h2>
            <div className="mt-3 overflow-auto">
              {submissions.length === 0 ? (
                <div className="text-sm text-gray-600">No submissions yet.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-3">Student</th>
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Submitted</th>
                      <th className="py-2 pr-3">Late</th>
                      <th className="py-2 pr-3">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .slice()
                      .sort((a, b) => String(a?.student?.studentId || '').localeCompare(String(b?.student?.studentId || '')))
                      .map((s) => (
                        <tr key={String(s?._id || s?.student?._id || s?.student)} className="border-t">
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {s?.student?.firstName} {s?.student?.lastName}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s?.student?.studentId || '—'}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            <span className={statusBadge(s.status)}>{s.status}</span>
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(s.submittedAt)}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s.isLate ? 'Yes' : 'No'}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s.marks ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {submissions.length ? (
            <Card className="mt-6">
              <h2 className="font-medium">Review / Return</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-sm font-medium">Select student</label>
                  <Select className="mt-2" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                    {submissions.map((s) => {
                      const sid = s?.student?._id || s?.student
                      const label = `${s?.student?.studentId || '—'} - ${s?.student?.firstName || ''} ${s?.student?.lastName || ''}`
                      return (
                        <option key={String(sid)} value={String(sid)}>
                          {label}
                        </option>
                      )
                    })}
                  </Select>

                  <div className="mt-3 text-sm text-gray-600">
                    Status: <span className={statusBadge(selectedSubmission?.status)}>{selectedSubmission?.status || '—'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Submission files</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedSubmission?.files || []).length === 0 ? (
                      <div className="text-sm text-gray-600">No files.</div>
                    ) : (
                      (selectedSubmission?.files || []).map((f) => (
                        <Button
                          key={String(f?.fileId || f?.url)}
                          size="sm"
                          onClick={() => setPreviewFile(f)}
                        >
                          {f?.name || 'File'}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">Feedback</label>
                <Textarea
                  className="mt-2 w-full"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write feedback (optional)"
                />
              </div>

              {homework.gradingMode === 'marks' ? (
                <div className="mt-4">
                  <label className="text-sm font-medium">Marks</label>
                  <Input
                    type="number"
                    inputClassName="mt-2"
                    min={0}
                    max={homework.maxMarks ?? undefined}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder={`0-${homework.maxMarks ?? homework.totalMarks ?? ''}`}
                  />
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={onReceive}
                  disabled={saving || !selectedSubmission || selectedSubmission?.status !== 'submitted'}
                >
                  Mark Received
                </Button>
                <Button
                  variant="primary"
                  onClick={onReturn}
                  disabled={saving || !selectedSubmission || !['submitted', 'received'].includes(String(selectedSubmission?.status))}
                >
                  {saving ? 'Saving…' : 'Return with Feedback'}
                </Button>
              </div>

              <div className="text-xs text-gray-600 mt-2">
                Student can only cancel/resubmit before due date and before you receive/return.
              </div>
            </Card>
          ) : null}
        </>
      )}

      <InlineFilePreview file={previewFile} onClear={() => setPreviewFile(null)} />
    </div>
  )
}

=======
﻿"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'
import homeworksService from '@/services/homeworksService'
import InlineFilePreview from '@/components/homework/InlineFilePreview'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

function fmtDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function statusBadge(status) {
  const s = String(status || '')
  const base = 'px-2 py-1 rounded text-xs border'
  if (s === 'submitted') return `${base} border-amber-300 text-amber-800`
  if (s === 'received') return `${base} border-blue-300 text-blue-800`
  if (s === 'returned') return `${base} border-green-300 text-green-800`
  return `${base} border-gray-200 text-gray-700`
}

export default function Page({ params }) {
  const id = params?.id
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [homework, setHomework] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [marks, setMarks] = useState('')
  const [feedback, setFeedback] = useState('')

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await homeworksService.get(id)
      setHomework(res?.homework || null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load homework')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const submissions = useMemo(() => (Array.isArray(homework?.submissions) ? homework.submissions : []), [homework])
  const attachments = useMemo(() => (Array.isArray(homework?.attachments) ? homework.attachments : []), [homework])

  const selectedSubmission = useMemo(() => {
    if (!selectedStudentId) return null
    return submissions.find((s) => String(s?.student?._id || s?.student) === String(selectedStudentId)) || null
  }, [submissions, selectedStudentId])

  useEffect(() => {
    if (!selectedStudentId && submissions.length) {
      const first = submissions[0]
      const sid = first?.student?._id || first?.student
      if (sid) setSelectedStudentId(String(sid))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions.length])

  async function onReceive() {
    if (!selectedSubmission) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await homeworksService.receive(id, { submissionStudentId: selectedStudentId })
      setSuccess('Marked as received')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to mark received')
    } finally {
      setSaving(false)
    }
  }

  async function onReturn() {
    if (!selectedSubmission) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        submissionStudentId: selectedStudentId,
        feedback
      }
      if (homework?.gradingMode === 'marks') {
        payload.marks = Number(marks)
      }
      await homeworksService.returnSubmission(id, payload)
      setSuccess('Returned with feedback')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to return submission')
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteHomework() {
    if (!id || saving) return
    const ok = window.confirm('Delete this homework and all related files/submissions? This action cannot be undone.')
    if (!ok) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await homeworksService.remove(id)
      router.push('/teacher/homework')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete homework')
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Homework Details"
        subtitle="Review student submissions and return feedback."
        right={
          <div className="flex gap-2">
            <Button onClick={load} disabled={loading || saving}>
              Refresh
            </Button>
            <Button onClick={onDeleteHomework} disabled={loading || saving}>
              Delete
            </Button>
            <ButtonLink href="/teacher/homework">Back</ButtonLink>
          </div>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      {loading ? (
        <div className="mt-6"><Skeleton className="h-40" /></div>
      ) : !homework ? (
        <div className="mt-6 text-sm text-gray-600">Not found.</div>
      ) : (
        <>
          <Card className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Title</div>
                <div className="font-medium mt-1">{homework.title}</div>
                <div className="text-sm text-gray-600 mt-2">Class</div>
                <div className="mt-1">{homework.class}-{homework.section}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Subject</div>
                <div className="mt-1">{homework.subjectName || homework?.subject?.name || '—'}</div>
                <div className="text-sm text-gray-600 mt-2">Due</div>
                <div className="mt-1">{fmtDate(homework.dueDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Grading</div>
                <div className="mt-1">{homework.gradingMode === 'marks' ? `Marks (max ${homework.maxMarks ?? homework.totalMarks ?? '—'})` : 'No marks'}</div>
                <div className="text-sm text-gray-600 mt-2">Status</div>
                <div className="mt-1">{homework.status}</div>
              </div>
            </div>
            {homework.description ? (
              <div className="mt-4">
                <div className="text-sm text-gray-600">Description</div>
                <div className="mt-1 whitespace-pre-wrap">{homework.description}</div>
              </div>
            ) : null}
          </Card>

          <Card className="mt-6">
            <h2 className="font-medium">Attachments</h2>
            <div className="mt-3">
              {attachments.length === 0 ? (
                <div className="text-sm text-gray-600">No attachments.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((f) => (
                    <Button
                      key={String(f?.fileId || f?.url)}
                      size="sm"
                      onClick={() => setPreviewFile(f)}
                    >
                      {f?.name || 'Attachment'}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="font-medium">Submissions</h2>
            <div className="mt-3 overflow-auto">
              {submissions.length === 0 ? (
                <div className="text-sm text-gray-600">No submissions yet.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-3">Student</th>
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Submitted</th>
                      <th className="py-2 pr-3">Late</th>
                      <th className="py-2 pr-3">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .slice()
                      .sort((a, b) => String(a?.student?.studentId || '').localeCompare(String(b?.student?.studentId || '')))
                      .map((s) => (
                        <tr key={String(s?._id || s?.student?._id || s?.student)} className="border-t">
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {s?.student?.firstName} {s?.student?.lastName}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s?.student?.studentId || '—'}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            <span className={statusBadge(s.status)}>{s.status}</span>
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(s.submittedAt)}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s.isLate ? 'Yes' : 'No'}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s.marks ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {submissions.length ? (
            <Card className="mt-6">
              <h2 className="font-medium">Review / Return</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-sm font-medium">Select student</label>
                  <Select className="mt-2" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                    {submissions.map((s) => {
                      const sid = s?.student?._id || s?.student
                      const label = `${s?.student?.studentId || '—'} - ${s?.student?.firstName || ''} ${s?.student?.lastName || ''}`
                      return (
                        <option key={String(sid)} value={String(sid)}>
                          {label}
                        </option>
                      )
                    })}
                  </Select>

                  <div className="mt-3 text-sm text-gray-600">
                    Status: <span className={statusBadge(selectedSubmission?.status)}>{selectedSubmission?.status || '—'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Submission files</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedSubmission?.files || []).length === 0 ? (
                      <div className="text-sm text-gray-600">No files.</div>
                    ) : (
                      (selectedSubmission?.files || []).map((f) => (
                        <Button
                          key={String(f?.fileId || f?.url)}
                          size="sm"
                          onClick={() => setPreviewFile(f)}
                        >
                          {f?.name || 'File'}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">Feedback</label>
                <Textarea
                  className="mt-2 w-full"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write feedback (optional)"
                />
              </div>

              {homework.gradingMode === 'marks' ? (
                <div className="mt-4">
                  <label className="text-sm font-medium">Marks</label>
                  <Input
                    type="number"
                    inputClassName="mt-2"
                    min={0}
                    max={homework.maxMarks ?? undefined}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder={`0-${homework.maxMarks ?? homework.totalMarks ?? ''}`}
                  />
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={onReceive}
                  disabled={saving || !selectedSubmission || selectedSubmission?.status !== 'submitted'}
                >
                  Mark Received
                </Button>
                <Button
                  variant="primary"
                  onClick={onReturn}
                  disabled={saving || !selectedSubmission || !['submitted', 'received'].includes(String(selectedSubmission?.status))}
                >
                  {saving ? 'Saving…' : 'Return with Feedback'}
                </Button>
              </div>

              <div className="text-xs text-gray-600 mt-2">
                Student can only cancel/resubmit before due date and before you receive/return.
              </div>
            </Card>
          ) : null}
        </>
      )}

      <InlineFilePreview file={previewFile} onClear={() => setPreviewFile(null)} />
    </div>
  )
}

>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
