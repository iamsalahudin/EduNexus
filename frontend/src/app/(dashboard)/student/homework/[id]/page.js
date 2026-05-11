"use client"

import { useEffect, useMemo, useState } from 'react'
import Skeleton from '@/components/ui/Skeleton'
import homeworksService from '@/services/homeworksService'
import InlineFilePreview from '@/components/homework/InlineFilePreview'
import { Button, ButtonLink, Card, Input, PageHeader, Textarea } from '@/components/ui'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

function statusText(status) {
  if (!status) return 'Not started'
  return String(status)
}

export default function Page({ params }) {
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [homework, setHomework] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  const [contentText, setContentText] = useState('')
  const [uploadFiles, setUploadFiles] = useState([])

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await homeworksService.get(id)
      setHomework(res?.homework || null)
      const sub = (res?.homework?.submissions || [])[0] || null
      setContentText(String(sub?.contentText || ''))
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

  const attachments = useMemo(() => (Array.isArray(homework?.attachments) ? homework.attachments : []), [homework])
  const submission = useMemo(() => (Array.isArray(homework?.submissions) ? homework.submissions[0] : null), [homework])
  const submissionFiles = useMemo(() => (Array.isArray(submission?.files) ? submission.files : []), [submission])

  const canEdit = useMemo(() => {
    const st = submission?.status
    return !st || st === 'draft'
  }, [submission])

  const canSubmit = useMemo(() => {
    return canEdit && (submissionFiles.length > 0 || String(contentText || '').trim().length > 0)
  }, [canEdit, submissionFiles.length, contentText])

  const canCancel = useMemo(() => {
    return submission?.status === 'submitted'
  }, [submission])

  async function onSaveDraft() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await homeworksService.updateDraft(id, { contentText })
      setSuccess('Draft saved')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  async function onUpload() {
    if (!uploadFiles.length) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await homeworksService.uploadSubmissionFiles(id, uploadFiles)
      setSuccess('Files uploaded')
      setUploadFiles([])
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to upload files')
    } finally {
      setSaving(false)
    }
  }

  async function onSubmit() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await homeworksService.submit(id)
      setSuccess('Submitted')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  async function onCancel() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await homeworksService.cancel(id)
      setSuccess('Submission cancelled (back to draft)')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to cancel')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Homework"
        subtitle="Upload your work and submit before the due date."
        actions={
          <div className="flex gap-2">
            <Button type="button" onClick={load} disabled={loading || saving}>
              Refresh
            </Button>
            <ButtonLink href="/student/homework">Back</ButtonLink>
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
                <div className="text-sm text-gray-600 mt-2">Subject</div>
                <div className="mt-1">{homework.subjectName || homework?.subject?.name || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Teacher</div>
                <div className="mt-1">{homework.teacherName || homework?.teacher?.name || '—'}</div>
                <div className="text-sm text-gray-600 mt-2">Due date</div>
                <div className="mt-1">{fmtDate(homework.dueDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Your status</div>
                <div className="mt-1">{statusText(submission?.status)}</div>
                {submission?.status === 'returned' ? (
                  <div className="mt-2 text-sm">
                    <div className="text-gray-600">Feedback</div>
                      <div className="mt-1 whitespace-pre-wrap">{submission?.feedback || '—'}</div>
                    {homework.gradingMode === 'marks' ? (
                        <div className="mt-2">Marks: {submission?.marks ?? '—'}</div>
                    ) : null}
                  </div>
                ) : null}
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
            <h2 className="font-medium">Teacher Attachments</h2>
            <div className="mt-3">
              {attachments.length === 0 ? (
                <div className="text-sm text-gray-600">No attachments.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((f) => (
                    <Button
                      type="button"
                      key={String(f?.fileId || f?.url)}
                      className="text-sm"
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
            <h2 className="font-medium">Your Submission</h2>

            <div className="mt-3">
              <Textarea
                label="Work text (optional)"
                rows={4}
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                disabled={!canEdit || saving}
                placeholder={
                  canEdit
                    ? 'Write your answer / notes…'
                    : 'Editing is locked after submit/receive/return.'
                }
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" onClick={onSaveDraft} disabled={!canEdit || saving}>
                  Save Draft
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Upload files (PDF/images)</label>
              <Input
                inputClassName="mt-2"
                type="file"
                multiple
                accept="application/pdf,image/*"
                onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                disabled={!canEdit || saving}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={onUpload}
                  disabled={!canEdit || saving || uploadFiles.length === 0}
                >
                  Upload
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600">Uploaded files</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {submissionFiles.length === 0 ? (
                  <div className="text-sm text-gray-600">No files uploaded.</div>
                ) : (
                  submissionFiles.map((f) => (
                    <Button
                      type="button"
                      key={String(f?.fileId || f?.url)}
                      className="text-sm"
                      onClick={() => setPreviewFile(f)}
                    >
                      {f?.name || 'File'}
                    </Button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={onSubmit} disabled={!canSubmit || saving}>
                Submit
              </Button>
              <Button type="button" onClick={onCancel} disabled={!canCancel || saving}>
                Cancel Submission
              </Button>
            </div>

            <div className="text-xs text-gray-600 mt-2">
              You can cancel/resubmit until the due date, unless the teacher has received/returned your work.
            </div>
          </Card>
        </>
      )}

      <InlineFilePreview file={previewFile} onClear={() => setPreviewFile(null)} />
    </div>
  )
}

