"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'

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
  const [error, setError] = useState('')
  const [filterClass, setFilterClass] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [cRes, sRes] = await Promise.all([
        classesService.listClasses({ active: true }),
        subjectsService.listSubjects({ active: true })
      ])
      setClasses(Array.isArray(cRes?.classes) ? cRes.classes : [])
      setSubjects(Array.isArray(sRes?.subjects) ? sRes.subjects : [])
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
    list.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
    return list
  }, [classes])

  const visibleClasses = useMemo(() => {
    if (!filterClass) return sortedClasses
    return sortedClasses.filter((c) => String(c?.name) === String(filterClass))
  }, [sortedClasses, filterClass])

  return (
    <div>
      <PageHeader title="Subjects" subtitle="View subjects per class." />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="font-medium">Subjects by Class</div>
          <Select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="">All classes</option>
            {sortedClasses.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="mt-4"><Skeleton className="h-24" /></div>
        ) : (
          <div className="mt-4 space-y-4">
            {visibleClasses.map((c) => {
              const list = (subjectsByClass.get(c.name) || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              const names = list.map((s) => s.name)
              return (
                <div key={c._id} className="border rounded p-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{names.length ? names.join(', ') : '(none)'}</div>
                </div>
              )
            })}
            {visibleClasses.length === 0 ? <div className="text-sm text-gray-600">No classes.</div> : null}
          </div>
        )}
      </Card>
    </div>
  )
}

