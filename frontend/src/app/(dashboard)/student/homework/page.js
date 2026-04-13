"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import homeworksService from '@/services/homeworksService'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

function submissionLabel(hw) {
  const s = hw?.submissionDetails?.status
  if (!s) return 'Not started'
  if (s === 'draft') return 'Draft'
  if (s === 'submitted') return 'Submitted'
  if (s === 'received') return 'Received'
  if (s === 'returned') return 'Returned'
  return String(s)
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [bootLoading, setBootLoading] = useState(true)
  const [error, setError] = useState('')
  const [homeworks, setHomeworks] = useState([])

  const [classes, setClasses] = useState([])
  const [cls, setCls] = useState('')
  const [section, setSection] = useState('')

  async function boot() {
    setBootLoading(true)
    try {
      const cRes = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(cRes?.classes) ? cRes.classes : [])
    } catch {
      setClasses([])
    } finally {
      setBootLoading(false)
    }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await homeworksService.list({})
      const list = Array.isArray(res?.homeworks) ? res.homeworks : []
      setHomeworks(list)
      // Student's class/section is fixed; infer from results for display
      if (!cls && list.length) setCls(String(list[0]?.class || ''))
      if (!section && list.length) setSection(String(list[0]?.section || ''))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load homework')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    boot()
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedClass = useMemo(() => classes.find((c) => String(c?.name) === String(cls)) || null, [classes, cls])
  const sections = useMemo(() => (Array.isArray(selectedClass?.sections) ? selectedClass.sections : []), [selectedClass])

  useEffect(() => {
    if (!cls) {
      if (section) setSection('')
      return
    }
    if (sections.length === 0) return
    if (section && !sections.includes(section)) setSection('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, sections])

  const rows = useMemo(() => {
    const list = Array.isArray(homeworks) ? [...homeworks] : []
    list.sort((a, b) => new Date(a?.dueDate || 0) - new Date(b?.dueDate || 0))
    return list
  }, [homeworks])

  return (
    <div>
      <PageHeader
        title="Homework"
        subtitle="View homework, upload your work, and submit before the due date."
        right={
          <Button onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        <h2 className="font-medium">Your Class</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Class</label>
            {bootLoading ? (
              <div className="mt-2"><Skeleton className="h-10" /></div>
            ) : (
              <Select className="mt-2" value={cls} onChange={(e) => setCls(e.target.value)} disabled>
                <option value="">—</option>
                {cls ? <option value={cls}>{cls}</option> : null}
              </Select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Section</label>
            {bootLoading ? (
              <div className="mt-2"><Skeleton className="h-10" /></div>
            ) : (
              <Select className="mt-2" value={section} onChange={(e) => setSection(e.target.value)} disabled>
                <option value="">—</option>
                {section ? <option value={section}>{section}</option> : null}
              </Select>
            )}
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">Locked to your profile</div>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-medium">Assigned Homework</h2>
        <div className="mt-3 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">No homework found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Teacher</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">Your Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((hw) => (
                  <tr key={hw._id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{hw.title}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{hw.subjectName || hw?.subject?.name || '—'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{hw.teacherName || hw?.teacher?.name || '—'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(hw.dueDate)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{submissionLabel(hw)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <ButtonLink href={`/student/homework/${hw._id}`} variant="outline" size="sm">
                        Open
                      </ButtonLink>
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

