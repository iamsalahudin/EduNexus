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

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [bootLoading, setBootLoading] = useState(true)
  const [error, setError] = useState('')
  const [homeworks, setHomeworks] = useState([])
  const [classes, setClasses] = useState([])

  const [cls, setCls] = useState('')
  const [section, setSection] = useState('')
  const [status, setStatus] = useState('')

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
      const params = {}
      if (cls) params.class = cls
      if (section) params.section = section
      if (status) params.status = status
      const res = await homeworksService.list(params)
      setHomeworks(Array.isArray(res?.homeworks) ? res.homeworks : [])
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
    if (sections.length === 0) {
      if (section) setSection('')
      return
    }
    if (section && !sections.includes(section)) setSection('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, sections])

  const rows = useMemo(() => {
    const list = Array.isArray(homeworks) ? [...homeworks] : []
    list.sort((a, b) => new Date(b?.postedDate || b?.createdAt || 0) - new Date(a?.postedDate || a?.createdAt || 0))
    return list
  }, [homeworks])

  return (
    <div>
      <PageHeader
        title="Homework"
        subtitle="Create homework, review submissions, and return feedback."
        right={
          <ButtonLink href="/teacher/homework/create" variant="primary">
            Create Homework
          </ButtonLink>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm font-medium">Class (optional)</label>
            {bootLoading ? (
              <div className="mt-2"><Skeleton className="h-10" /></div>
            ) : (
              <Select className="mt-2" value={cls} onChange={(e) => setCls(e.target.value)}>
                <option value="">All classes</option>
                {classes
                  .slice()
                  .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
                  .map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Section (optional)</label>
            {bootLoading ? (
              <div className="mt-2"><Skeleton className="h-10" /></div>
            ) : (
              <Select
                className="mt-2"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                disabled={!cls || sections.length === 0}
              >
                <option value="">
                  {!cls ? 'Select class first' : sections.length === 0 ? 'No sections' : 'All sections'}
                </option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select className="mt-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="primary" onClick={load} disabled={loading}>
              {loading ? 'Loading…' : 'Apply'}
            </Button>
            <Button onClick={() => { setCls(''); setSection(''); setStatus(''); }} disabled={loading}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-medium">Your Homework</h2>
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
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">Submissions</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((hw) => (
                  <tr key={hw._id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{hw.title}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{hw.class}{hw.section ? `-${hw.section}` : ''}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{hw.subjectName || hw?.subject?.name || '—'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(hw.dueDate)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{Array.isArray(hw.submissions) ? hw.submissions.length : 0}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{hw.status}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <ButtonLink href={`/teacher/homework/${hw._id}`} variant="outline" size="sm">
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

