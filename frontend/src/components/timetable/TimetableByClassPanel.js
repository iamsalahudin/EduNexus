<<<<<<< HEAD
﻿"use client"

import { useEffect, useMemo, useState } from 'react'
import TimetableSlotsBoard from '@/components/timetable/TimetableSlotsBoard'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import timetableService from '@/services/timetableService'

function slotClass(slot) {
  return String(slot?.class || '').trim()
}

function slotSection(slot) {
  return String(slot?.section || '').trim()
}

export default function TimetableByClassPanel({ roleBase = '/admin' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timetables, setTimetables] = useState([])
  const [sectionEnabledByClass, setSectionEnabledByClass] = useState({})

  const [year, setYear] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await timetableService.listTimetables({ isActive: true, view: 'explorer' })
      const list = Array.isArray(res?.timetables) ? res.timetables : []
      setTimetables(list)
      setSectionEnabledByClass(res?.meta?.sectionSelectionEnabledByClass || {})
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load class timetables')
      setTimetables([])
      setSectionEnabledByClass({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const years = useMemo(() => {
    return [...new Set(timetables.map((t) => String(t?.year || '')).filter(Boolean))].sort((a, b) => Number(b) - Number(a))
  }, [timetables])

  useEffect(() => {
    if (!year && years.length) setYear(years[0])
  }, [years, year])

  const rowsByYear = useMemo(() => {
    if (!year) return []
    return timetables.filter((t) => String(t?.year || '') === year)
  }, [timetables, year])

  const classes = useMemo(() => {
    const set = new Set()
    rowsByYear.forEach((row) => {
      ;(row?.slots || []).forEach((slot) => {
        const cls = slotClass(slot)
        if (cls) set.add(cls)
      })
    })
    return [...set].sort()
  }, [rowsByYear])

  useEffect(() => {
    if (!classId && classes.length) {
      setClassId(classes[0])
      return
    }
    if (classId && !classes.includes(classId)) {
      setClassId(classes[0] || '')
    }
  }, [classes, classId])

  const sectionsForClass = useMemo(() => {
    if (!classId) return []
    const set = new Set()
    rowsByYear.forEach((row) => {
      ;(row?.slots || []).forEach((slot) => {
        if (slotClass(slot) !== classId) return
        const section = slotSection(slot)
        if (section) set.add(section)
      })
    })
    return [...set].sort()
  }, [rowsByYear, classId])

  const sectionSelectorEnabled = useMemo(() => {
    return Boolean(sectionEnabledByClass?.[classId]) && sectionsForClass.length > 0
  }, [sectionEnabledByClass, classId, sectionsForClass])

  useEffect(() => {
    if (!sectionSelectorEnabled) {
      setSectionId('')
      return
    }

    if (!sectionId && sectionsForClass.length) {
      setSectionId(sectionsForClass[0])
      return
    }

    if (sectionId && !sectionsForClass.includes(sectionId)) {
      setSectionId(sectionsForClass[0] || '')
    }
  }, [sectionSelectorEnabled, sectionId, sectionsForClass])

  const mergedForClass = useMemo(() => {
    if (!classId) return null

    const source = rowsByYear.find((row) => (row?.slots || []).some((slot) => slotClass(slot) === classId))
    if (!source) return null

    const slots = rowsByYear
      .flatMap((row) => Array.isArray(row?.slots) ? row.slots : [])
      .filter((slot) => {
        if (slotClass(slot) !== classId) return false
        if (!sectionSelectorEnabled) return true
        return slotSection(slot) === sectionId
      })

    return {
      ...source,
      class: classId,
      section: sectionSelectorEnabled ? sectionId : '',
      slots,
    }
  }, [rowsByYear, classId, sectionId, sectionSelectorEnabled])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader
        title="Timetable - By Class"
        subtitle="Filter by class to view periods from level timetables."
        right={<Button onClick={load} disabled={loading}>Refresh</Button>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid md:grid-cols-4 gap-4">
        <aside className="md:col-span-1 space-y-3">
          <Card className="p-3">
            {loading ? <Skeleton className="h-20" /> : (
              <Select label="Academic Year" value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            )}

            <div className="mt-3">
              {loading ? <Skeleton className="h-32" /> : (
                <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}>
                  {classes.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              )}
            </div>

            <div className="mt-3">
              {loading ? <Skeleton className="h-16" /> : (
                <Select
                  label="Section"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  disabled={!sectionSelectorEnabled}
                >
                  {!sectionSelectorEnabled ? <option value="">Not section-wise</option> : null}
                  {sectionsForClass.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              )}
            </div>
          </Card>
        </aside>

        <main className="md:col-span-3">
          {loading ? (
            <Card className="p-6"><Skeleton className="h-64" /></Card>
          ) : mergedForClass && mergedForClass.slots.length ? (
            <TimetableSlotsBoard timetable={mergedForClass} viewRole="by-class" />
          ) : (
            <Card className="p-6 text-center text-gray-600">No timetable found for selected class.</Card>
          )}
        </main>
      </div>
    </div>
  )
}
=======
﻿"use client"

import { useEffect, useMemo, useState } from 'react'
import TimetableSlotsBoard from '@/components/timetable/TimetableSlotsBoard'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import timetableService from '@/services/timetableService'

function slotClass(slot) {
  return String(slot?.class || '').trim()
}

function slotSection(slot) {
  return String(slot?.section || '').trim()
}

export default function TimetableByClassPanel({ roleBase = '/admin' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timetables, setTimetables] = useState([])
  const [sectionEnabledByClass, setSectionEnabledByClass] = useState({})

  const [year, setYear] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await timetableService.listTimetables({ isActive: true, view: 'explorer' })
      const list = Array.isArray(res?.timetables) ? res.timetables : []
      setTimetables(list)
      setSectionEnabledByClass(res?.meta?.sectionSelectionEnabledByClass || {})
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load class timetables')
      setTimetables([])
      setSectionEnabledByClass({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const years = useMemo(() => {
    return [...new Set(timetables.map((t) => String(t?.year || '')).filter(Boolean))].sort((a, b) => Number(b) - Number(a))
  }, [timetables])

  useEffect(() => {
    if (!year && years.length) setYear(years[0])
  }, [years, year])

  const rowsByYear = useMemo(() => {
    if (!year) return []
    return timetables.filter((t) => String(t?.year || '') === year)
  }, [timetables, year])

  const classes = useMemo(() => {
    const set = new Set()
    rowsByYear.forEach((row) => {
      ;(row?.slots || []).forEach((slot) => {
        const cls = slotClass(slot)
        if (cls) set.add(cls)
      })
    })
    return [...set].sort()
  }, [rowsByYear])

  useEffect(() => {
    if (!classId && classes.length) {
      setClassId(classes[0])
      return
    }
    if (classId && !classes.includes(classId)) {
      setClassId(classes[0] || '')
    }
  }, [classes, classId])

  const sectionsForClass = useMemo(() => {
    if (!classId) return []
    const set = new Set()
    rowsByYear.forEach((row) => {
      ;(row?.slots || []).forEach((slot) => {
        if (slotClass(slot) !== classId) return
        const section = slotSection(slot)
        if (section) set.add(section)
      })
    })
    return [...set].sort()
  }, [rowsByYear, classId])

  const sectionSelectorEnabled = useMemo(() => {
    return Boolean(sectionEnabledByClass?.[classId]) && sectionsForClass.length > 0
  }, [sectionEnabledByClass, classId, sectionsForClass])

  useEffect(() => {
    if (!sectionSelectorEnabled) {
      setSectionId('')
      return
    }

    if (!sectionId && sectionsForClass.length) {
      setSectionId(sectionsForClass[0])
      return
    }

    if (sectionId && !sectionsForClass.includes(sectionId)) {
      setSectionId(sectionsForClass[0] || '')
    }
  }, [sectionSelectorEnabled, sectionId, sectionsForClass])

  const mergedForClass = useMemo(() => {
    if (!classId) return null

    const source = rowsByYear.find((row) => (row?.slots || []).some((slot) => slotClass(slot) === classId))
    if (!source) return null

    const slots = rowsByYear
      .flatMap((row) => Array.isArray(row?.slots) ? row.slots : [])
      .filter((slot) => {
        if (slotClass(slot) !== classId) return false
        if (!sectionSelectorEnabled) return true
        return slotSection(slot) === sectionId
      })

    return {
      ...source,
      class: classId,
      section: sectionSelectorEnabled ? sectionId : '',
      slots,
    }
  }, [rowsByYear, classId, sectionId, sectionSelectorEnabled])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader
        title="Timetable - By Class"
        subtitle="Filter by class to view periods from level timetables."
        right={<Button onClick={load} disabled={loading}>Refresh</Button>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid md:grid-cols-4 gap-4">
        <aside className="md:col-span-1 space-y-3">
          <Card className="p-3">
            {loading ? <Skeleton className="h-20" /> : (
              <Select label="Academic Year" value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            )}

            <div className="mt-3">
              {loading ? <Skeleton className="h-32" /> : (
                <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}>
                  {classes.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              )}
            </div>

            <div className="mt-3">
              {loading ? <Skeleton className="h-16" /> : (
                <Select
                  label="Section"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  disabled={!sectionSelectorEnabled}
                >
                  {!sectionSelectorEnabled ? <option value="">Not section-wise</option> : null}
                  {sectionsForClass.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              )}
            </div>
          </Card>
        </aside>

        <main className="md:col-span-3">
          {loading ? (
            <Card className="p-6"><Skeleton className="h-64" /></Card>
          ) : mergedForClass && mergedForClass.slots.length ? (
            <TimetableSlotsBoard timetable={mergedForClass} viewRole="by-class" />
          ) : (
            <Card className="p-6 text-center text-gray-600">No timetable found for selected class.</Card>
          )}
        </main>
      </div>
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
