"use client"

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'

function groupByClass(subjects = []) {
  const map = new Map()
  subjects.forEach((s) => {
    const key = String(s?.className || '').trim()
    if (!key) return
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(s)
  })
  return map
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [defaults, setDefaults] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [sortDir, setSortDir] = useState('asc')
  const [filterClass, setFilterClass] = useState('')

  const [newClassName, setNewClassName] = useState('')
  const [newSubjectName, setNewSubjectName] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const [cRes, sRes] = await Promise.all([
        classesService.listClasses({ active: true }),
        subjectsService.listSubjects({})
      ])
      setClasses(Array.isArray(cRes?.classes) ? cRes.classes : [])
      setSubjects(Array.isArray(sRes?.subjects) ? sRes.subjects : [])
      setDefaults(Array.isArray(sRes?.defaults) ? sRes.defaults : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subjectsByClass = useMemo(() => groupByClass(subjects), [subjects])

  const sortedClasses = useMemo(() => {
    const list = Array.isArray(classes) ? [...classes] : []
    list.sort((a, b) => {
      const aa = String(a?.name || '').toLowerCase()
      const bb = String(b?.name || '').toLowerCase()
      if (aa < bb) return sortDir === 'asc' ? -1 : 1
      if (aa > bb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [classes, sortDir])

  const visibleClasses = useMemo(() => {
    if (!filterClass) return sortedClasses
    return sortedClasses.filter((c) => String(c?.name) === String(filterClass))
  }, [sortedClasses, filterClass])

  async function createSubject(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await subjectsService.createSubject({ className: newClassName, name: newSubjectName })
      setSuccess('Subject created')
      setNewSubjectName('')
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to create subject')
    }
  }

  async function applyDefaultsToSelected() {
    setError('')
    setSuccess('')
    try {
      if (!filterClass) {
        setError('Select a class to apply defaults')
        return
      }
      await subjectsService.applyDefaults({ className: filterClass })
      setSuccess('Default subjects applied')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to apply defaults')
    }
  }

  async function applyDefaultsToAll() {
    setError('')
    setSuccess('')
    try {
      await subjectsService.applyDefaults({})
      setSuccess('Default subjects applied to all classes')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to apply defaults')
    }
  }

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Subjects are managed per class (no sections). Use the edit page to reorder via drag & drop."
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <h2 className="font-medium">Create Subject</h2>
          <form className="mt-4 space-y-3" onSubmit={createSubject}>
            <Select value={newClassName} onChange={(e) => setNewClassName(e.target.value)} required>
              <option value="">Select class</option>
              {sortedClasses.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Subject name (e.g., Mathematics)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              required
            />
            <Button variant="primary" type="submit">
              Create
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Default Subjects</h2>
              <p className="text-sm text-gray-600 mt-1">Applied automatically on class creation. You can also apply them to existing classes (missing only).</p>
            </div>
            <Button type="button" onClick={load}>Refresh</Button>
          </div>

          <div className="mt-3 text-sm">
            {defaults.length ? defaults.join(', ') : '—'}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={applyDefaultsToSelected}>
              Apply Defaults to Selected Class
            </Button>
            <Button type="button" onClick={applyDefaultsToAll}>
              Apply Defaults to All Classes
            </Button>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-medium">Subjects by Class</h2>
            <p className="text-sm text-gray-600 mt-1">Sort and open a class to reorder subjects via drag & drop.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="">All classes</option>
              {sortedClasses.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            >
              Sort: {sortDir === 'asc' ? 'A→Z' : 'Z→A'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-4"><Skeleton className="h-24" /></div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Subjects</th>
                  <th className="py-2 pr-3">Count</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleClasses.map((c) => {
                  const list = subjectsByClass.get(c.name) || []
                  const names = list
                    .filter((s) => s?.active !== false)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((s) => s.name)

                  return (
                    <tr key={c._id} className="border-t">
                      <td className="py-2 pr-3 whitespace-nowrap">{c.name}</td>
                      <td className="py-2 pr-3">
                        {names.length ? names.join(', ') : <span className="text-gray-500">(none)</span>}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{list.length}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <ButtonLink href={`/admin/subjects/${encodeURIComponent(c.name)}`} variant="outline" size="sm">
                          Edit / Reorder
                        </ButtonLink>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {visibleClasses.length === 0 ? (
              <div className="text-sm text-gray-600 mt-3">No classes found.</div>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  )
}


