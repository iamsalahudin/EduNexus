"use client"

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import homeworksService from '@/services/homeworksService'
import { Button, ButtonLink, Card, PageHeader, Select, Skeleton } from '@/components/ui'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [bootLoading, setBootLoading] = useState(true)
  const [error, setError] = useState('')
  const [classes, setClasses] = useState([])
  const [homeworks, setHomeworks] = useState([])

  const [cls, setCls] = useState('')
  const [section, setSection] = useState('')
  const [sortBy, setSortBy] = useState('dueDate')
  const [order, setOrder] = useState('asc')

  async function boot() {
    setBootLoading(true)
    setError('')
    try {
      const cRes = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(cRes?.classes) ? cRes.classes : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load classes')
    } finally {
      setBootLoading(false)
    }
  }

  useEffect(() => {
    boot()
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

  async function load() {
    setError('')
    if (!cls || !section) {
      setError('Select class and section')
      return
    }
    setLoading(true)
    try {
      const res = await homeworksService.list({ class: cls, section, sortBy, order })
      setHomeworks(Array.isArray(res?.homeworks) ? res.homeworks : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load homework')
    } finally {
      setLoading(false)
    }
  }

  const rows = useMemo(() => {
    const list = Array.isArray(homeworks) ? [...homeworks] : []
    return list
  }, [homeworks])

  return (
    <div>
      <PageHeader
        title="Homework"
        subtitle="Admin view (read-only). Filter by class and section."
        right={
          <Button type="button" onClick={load} disabled={loading || bootLoading}>
            Refresh
          </Button>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        {bootLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select label="Class" value={cls} onChange={(e) => setCls(e.target.value)}>
                <option value="">Select class</option>
                {classes
                  .slice()
                  .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
                  .map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
              </Select>

            <Select
              label="Section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={!cls || sections.length === 0}
            >
                <option value="">
                  {!cls ? 'Select class first' : sections.length === 0 ? 'No sections' : 'Select section'}
                </option>
                {sections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
            </Select>

            <Select label="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="dueDate">Due date</option>
                <option value="postedDate">Posted date</option>
                <option value="teacher">Teacher</option>
                <option value="subject">Subject</option>
              </Select>

            <Select label="Order" value={order} onChange={(e) => setOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Select>
            <div className="flex items-end">
              <Button type="button" variant="primary" onClick={load} disabled={loading || !cls || !section}>
                {loading ? 'Loading…' : 'Apply'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="font-medium">Results</h2>
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
                  <th className="py-2 pr-3">Submissions</th>
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
                    <td className="py-2 pr-3 whitespace-nowrap">{Array.isArray(hw.submissions) ? hw.submissions.length : 0}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <ButtonLink href={`/principal/homework/${hw._id}`} variant="outline" size="sm">
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

