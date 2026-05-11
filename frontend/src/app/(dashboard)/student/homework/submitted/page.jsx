'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import homeworksService from '@/services/homeworksService'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

function submissionLabel(status) {
  if (!status) return '—'
  if (status === 'submitted') return 'Submitted'
  if (status === 'received') return 'Received'
  if (status === 'returned') return 'Returned'
  if (status === 'draft') return 'Draft'
  return status
}

export default function SubmittedHomeworkPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [homeworks, setHomeworks] = useState([])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await homeworksService.list({})
      setHomeworks(Array.isArray(res?.homeworks) ? res.homeworks : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load submitted homework')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rows = useMemo(
    () => homeworks.filter((hw) => ['submitted', 'received', 'returned'].includes(hw?.submissionDetails?.status)).sort((a, b) => new Date(b?.updatedAt || b?.dueDate || 0) - new Date(a?.updatedAt || a?.dueDate || 0)),
    [homeworks]
  )

  return (
    <div>
      <PageHeader title="Submitted Homework" subtitle="Track your submitted homework status and teacher feedback state." right={<Button onClick={load} disabled={loading}>Refresh</Button>} />
      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        <div className="mt-1 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">No submitted homework yet.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((hw) => (
                  <tr key={hw._id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{hw.title}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{hw.subjectName || hw?.subject?.name || '—'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(hw.dueDate)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{submissionLabel(hw?.submissionDetails?.status)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <ButtonLink href={`/student/homework/${hw._id}`} size="sm" variant="outline">Open</ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
