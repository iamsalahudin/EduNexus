"use client"

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import homeworksService from '@/services/homeworksService'
import InlineFilePreview from '@/components/homework/InlineFilePreview'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

export default function Page({ params }) {
  const id = params?.id
  const search = useSearchParams()
  const childId = search.get('childId') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [homework, setHomework] = useState(null)
  const [child, setChild] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const res = await homeworksService.get(id, childId ? { childId } : undefined)
      setHomework(res?.homework || null)
      setChild(res?.child || null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load homework')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, childId])

  const attachments = useMemo(() => (Array.isArray(homework?.attachments) ? homework.attachments : []), [homework])
  const submission = useMemo(() => (Array.isArray(homework?.submissions) ? homework.submissions[0] : null), [homework])
  const submissionFiles = useMemo(() => (Array.isArray(submission?.files) ? submission.files : []), [submission])

  return (
    <div>
      <PageHeader
        title="Homework"
        subtitle="Parent view (read-only)."
        right={
          <div className="flex gap-2">
            <Button onClick={load} disabled={loading}>
              Refresh
            </Button>
            <ButtonLink href="/parent/homework">Back</ButtonLink>
          </div>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      {loading ? (
        <div className="mt-6"><Skeleton className="h-40" /></div>
      ) : !homework ? (
        <div className="mt-6 text-sm text-gray-600">Not found.</div>
      ) : (
        <>
          <Card className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Child</div>
                <div className="mt-1">{child ? `${child.studentId} - ${child.firstName} ${child.lastName}` : '—'}</div>
                <div className="text-sm text-gray-600 mt-2">Class</div>
                <div className="mt-1">{homework.class}-{homework.section}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Title</div>
                <div className="font-medium mt-1">{homework.title}</div>
                <div className="text-sm text-gray-600 mt-2">Due</div>
                <div className="mt-1">{fmtDate(homework.dueDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Teacher</div>
                <div className="mt-1">{homework.teacherName || homework?.teacher?.name || '—'}</div>
                <div className="text-sm text-gray-600 mt-2">Subject</div>
                <div className="mt-1">{homework.subjectName || homework?.subject?.name || '—'}</div>
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
            <h2 className="font-medium">Submission</h2>
            <div className="mt-3 text-sm text-gray-600">Status: {submission?.status || '—'}</div>

            {submission?.contentText ? (
              <div className="mt-3">
                <div className="text-sm text-gray-600">Text</div>
                <div className="mt-1 whitespace-pre-wrap">{submission.contentText}</div>
              </div>
            ) : null}

            <div className="mt-3">
              <div className="text-sm text-gray-600">Files</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {submissionFiles.length === 0 ? (
                  <div className="text-sm text-gray-600">No files.</div>
                ) : (
                  submissionFiles.map((f) => (
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

            {submission?.feedback ? (
              <div className="mt-4">
                <div className="text-sm text-gray-600">Teacher feedback</div>
                <div className="mt-1 whitespace-pre-wrap">{submission.feedback}</div>
              </div>
            ) : null}
            {homework.gradingMode === 'marks' ? (
              <div className="mt-2">Marks: {submission?.marks ?? '—'}</div>
            ) : null}
          </Card>
        </>
      )}

      <InlineFilePreview file={previewFile} onClear={() => setPreviewFile(null)} />
    </div>
  )
}

