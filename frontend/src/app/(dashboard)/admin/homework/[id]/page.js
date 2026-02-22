"use client"

import { useEffect, useMemo, useState } from 'react'
import homeworksService from '@/services/homeworksService'
import InlineFilePreview from '@/components/homework/InlineFilePreview'
import { Button, ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'

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

export default function Page({ params }) {
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [homework, setHomework] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
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

  const attachments = useMemo(() => (Array.isArray(homework?.attachments) ? homework.attachments : []), [homework])
  const submissions = useMemo(() => (Array.isArray(homework?.submissions) ? homework.submissions : []), [homework])

  return (
    <div>
      <PageHeader
        title="Homework"
        subtitle="Admin view (read-only)."
        right={
          <div className="flex gap-2">
            <Button type="button" onClick={load} disabled={loading}>
              Refresh
            </Button>
            <ButtonLink href="/admin/homework" variant="secondary">
              Back
            </ButtonLink>
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
                <div className="text-sm text-gray-600">Title</div>
                <div className="font-medium mt-1">{homework.title}</div>
                <div className="text-sm text-gray-600 mt-2">Class</div>
                <div className="mt-1">{homework.class}-{homework.section}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Teacher</div>
                <div className="mt-1">{homework.teacherName || homework?.teacher?.name || '—'}</div>
                <div className="text-sm text-gray-600 mt-2">Subject</div>
                <div className="mt-1">{homework.subjectName || homework?.subject?.name || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Due</div>
                <div className="mt-1">{fmtDate(homework.dueDate)}</div>
                <div className="text-sm text-gray-600 mt-2">Grading</div>
                <div className="mt-1">{homework.gradingMode === 'marks' ? `Marks (max ${homework.maxMarks ?? homework.totalMarks ?? '—'})` : 'No marks'}</div>
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
                      type="button"
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
                      <th className="py-2 pr-3">Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .slice()
                      .sort((a, b) => String(a?.student?.studentId || '').localeCompare(String(b?.student?.studentId || '')))
                      .map((s) => (
                        <tr key={String(s?._id || s?.student?._id || s?.student)} className="border-t">
                          <td className="py-2 pr-3 whitespace-nowrap">{s?.student?.firstName} {s?.student?.lastName}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s?.student?.studentId || '—'}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s.status}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(s.submittedAt)}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s.isLate ? 'Yes' : 'No'}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{s.marks ?? '—'}</td>
                          <td className="py-2 pr-3">
                            {(s.files || []).length === 0 ? (
                              <span className="text-gray-600">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {(s.files || []).map((f) => (
                                  <Button
                                    key={String(f?.fileId || f?.url)}
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPreviewFile(f)}
                                  >
                                    {f?.name || 'File'}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      )}

      <InlineFilePreview file={previewFile} onClear={() => setPreviewFile(null)} />
    </div>
  )
}

