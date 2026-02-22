"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import homeworksService from '@/services/homeworksService'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [children, setChildren] = useState([])
  const [homeworksByChild, setHomeworksByChild] = useState([])
  const [childId, setChildId] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await homeworksService.list({})
      setChildren(Array.isArray(res?.children) ? res.children : [])
      setHomeworksByChild(Array.isArray(res?.homeworksByChild) ? res.homeworksByChild : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load homework')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!childId && children.length) setChildId(String(children[0]._id))
  }, [children, childId])

  const selected = useMemo(() => {
    if (!childId) return null
    return children.find((c) => String(c._id) === String(childId)) || null
  }, [children, childId])

  const selectedHomeworks = useMemo(() => {
    if (!selected) return []
    const entry = homeworksByChild.find((x) => String(x?.child?._id) === String(selected._id))
    const list = Array.isArray(entry?.homeworks) ? entry.homeworks : []
    return list.slice().sort((a, b) => new Date(a?.dueDate || 0) - new Date(b?.dueDate || 0))
  }, [homeworksByChild, selected])

  return (
    <div>
      <PageHeader
        title="Homework"
        subtitle="View homework for your children."
        right={
          <Button onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-32" />
        ) : children.length === 0 ? (
          <div className="text-sm text-gray-600">No linked children found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Child</label>
                <Select className="mt-2" value={childId} onChange={(e) => setChildId(e.target.value)}>
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.studentId} - {c.firstName} {c.lastName}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Class</label>
                <Select className="mt-2" value={selected?.class || ''} disabled>
                  <option value="">—</option>
                  {selected?.class ? <option value={selected.class}>{selected.class}</option> : null}
                </Select>
                <div className="mt-3">
                  <label className="text-sm font-medium">Section</label>
                  <Select className="mt-2" value={selected?.section || ''} disabled>
                    <option value="">—</option>
                    {selected?.section ? <option value={selected.section}>{selected.section}</option> : null}
                  </Select>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Status</div>
                <div className="mt-2 text-sm text-gray-600">Read-only view</div>
              </div>
            </div>

            <div className="mt-5 overflow-auto">
              {selectedHomeworks.length === 0 ? (
                <div className="text-sm text-gray-600">No homework found for this child.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-3">Title</th>
                      <th className="py-2 pr-3">Subject</th>
                      <th className="py-2 pr-3">Teacher</th>
                      <th className="py-2 pr-3">Due</th>
                      <th className="py-2 pr-3">Submission</th>
                      <th className="py-2 pr-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedHomeworks.map((hw) => (
                      <tr key={hw._id} className="border-t">
                        <td className="py-2 pr-3 whitespace-nowrap">{hw.title}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{hw.subjectName || hw?.subject?.name || '—'}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{hw.teacherName || hw?.teacher?.name || '—'}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(hw.dueDate)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{hw?.submissionDetails?.status || '—'}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          <ButtonLink
                            href={`/parent/homework/${hw._id}?childId=${encodeURIComponent(String(selected?._id))}`}
                            variant="outline"
                            size="sm"
                          >
                            Open
                          </ButtonLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

