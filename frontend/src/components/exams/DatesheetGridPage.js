"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import examsService from '@/services/examsService'
import { Button, Card, Input, PageHeader, Select, ToggleBox } from '@/components/ui'

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toISODate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  return `${y}-${m}-${day}`
}

function fromISODate(iso) {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function addDaysIso(iso, days) {
  const d = fromISODate(iso)
  if (!d) return ''
  d.setDate(d.getDate() + Number(days || 0))
  return toISODate(d)
}

function isSundayIso(iso) {
  const d = fromISODate(iso)
  if (!d) return false
  return d.getDay() === 0
}

function nextDateIso({ lastIso, skipSundays }) {
  if (!lastIso) return ''
  let next = addDaysIso(lastIso, 1)
  if (!skipSundays) return next
  while (next && isSundayIso(next)) {
    next = addDaysIso(next, 1)
  }
  return next
}

function dayLabel(iso) {
  const d = fromISODate(iso)
  if (!d) return ''
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

function dateLabel(iso) {
  const d = fromISODate(iso)
  if (!d) return ''
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function monthOptions() {
  return [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' },
  ]
}

function defaultExamName(type, year, month) {
  const mLabel = month ? ` ${monthOptions().find((m) => m.value === Number(month))?.label || ''}` : ''
  if (type === 'monthly') return `Monthly Test${mLabel} (${year})`
  if (type === 'mid') return `Mid Term (${year})`
  if (type === 'final') return `Final Term (${year})`
  return `Exam (${year})`
}

function uniqSortedIsos(list) {
  const set = new Set((list || []).filter(Boolean))
  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))
}

export default function DatesheetGridPage({
  title = 'Exams Schedule',
  subtitle = 'View and edit datesheets in a simple grid.',
  canManage = false,
  baseRole = 'admin', // 'admin' | 'principal'
  showHeader = true
}) {
  const currentYear = new Date().getFullYear()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [classes, setClasses] = useState([])
  const [subjectsByClass, setSubjectsByClass] = useState({}) // className -> Subject[]

  const [configs, setConfigs] = useState([])

  const [examType, setExamType] = useState('mid')
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const [viewMode, setViewMode] = useState('full') // 'full' | 'class'
  const [selectedClass, setSelectedClass] = useState('')

  const [skipSundays, setSkipSundays] = useState(true)
  const [firstDate, setFirstDate] = useState('')

  const [dates, setDates] = useState([]) // iso list

  const [examsByClass, setExamsByClass] = useState({}) // className -> exam
  const [grid, setGrid] = useState({}) // className -> { [iso]: subjectId }

  const tableRef = useRef(null)

  const visibleClasses = useMemo(() => {
    const list = Array.isArray(classes) ? classes : []
    if (viewMode !== 'class') return list
    if (!selectedClass) return []
    return list.filter((c) => String(c?.name || '') === String(selectedClass))
  }, [classes, viewMode, selectedClass])

  const globalConfig = useMemo(() => {
    const list = Array.isArray(configs) ? configs : []
    return list[0] || null
  }, [configs])

  const allowedTypes = useMemo(() => {
    const cfg = globalConfig
    if (!cfg?.examTypes) return ['monthly', 'mid', 'final']
    const out = []
    if (cfg.examTypes?.mid?.enabled) out.push('mid')
    if (cfg.examTypes?.final?.enabled) out.push('final')
    if (cfg.examTypes?.monthly?.enabled) out.push('monthly')
    return out.length ? out : ['monthly', 'mid', 'final']
  }, [globalConfig])

  const allowedMonths = useMemo(() => {
    const months = globalConfig?.examTypes?.monthly?.months
    const list = Array.isArray(months) ? months.map((m) => Number(m)).filter((m) => m >= 1 && m <= 12) : null
    const uniq = list ? Array.from(new Set(list)).sort((a, b) => a - b) : null
    return uniq && uniq.length ? uniq : monthOptions().map((m) => m.value)
  }, [globalConfig])

  const yearOptions = useMemo(() => {
    const out = []
    for (let y = currentYear - 2; y <= currentYear + 1; y++) out.push(y)
    return out
  }, [currentYear])

  async function loadBasics() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const [{ classes: cls }, { configs: cfgs }] = await Promise.all([
        classesService.listClasses(),
        examsService.listConfigs(),
      ])
      const classList = Array.isArray(cls) ? cls : []
      classList.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
      setClasses(classList)
      setConfigs(Array.isArray(cfgs) ? cfgs : [])

      if (!selectedClass && classList.length) {
        setSelectedClass(String(classList[0]?.name || ''))
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  async function ensureSubjectsLoaded(className) {
    const name = String(className || '').trim()
    if (!name) return

    setSubjectsByClass((prev) => {
      if (prev[name]) return prev
      return { ...prev, [name]: null }
    })

    try {
      const { subjects } = await subjectsService.listSubjects({ className: name })
      const list = Array.isArray(subjects) ? subjects : []
      list.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
      setSubjectsByClass((prev) => ({ ...prev, [name]: list }))
    } catch {
      setSubjectsByClass((prev) => ({ ...prev, [name]: [] }))
    }
  }

  function buildGridFromExams({ classList, examMap }) {
    const nextGrid = {}
    const allDates = []

    for (const c of classList) {
      const className = String(c?.name || '').trim()
      if (!className) continue
      const ex = examMap[className]
      const row = {}
      const subs = Array.isArray(ex?.subjects) ? ex.subjects : []
      for (const s of subs) {
        const iso = s?.date ? toISODate(s.date) : ''
        const subjId = s?.subject?._id || s?.subject
        if (!iso || !subjId) continue
        if (!row[iso]) row[iso] = String(subjId)
        allDates.push(iso)
      }
      nextGrid[className] = row
    }

    setGrid(nextGrid)
    setDates(uniqSortedIsos(allDates))

    if (!firstDate && allDates.length) {
      setFirstDate(uniqSortedIsos(allDates)[0] || '')
    }
  }

  async function openOrCreateGrid() {
    setError('')
    setSuccess('')

    if (!examType || !year) {
      setError('Please select exam type and year')
      return
    }
    if (examType === 'monthly' && !month) {
      setError('Please select month for Monthly Test')
      return
    }

    setBusy(true)
    try {
      const { exams: existing } = await examsService.listExams({
        type: examType,
        year: Number(year),
        ...(examType === 'monthly' ? { month: Number(month) } : {})
      })
      const existingList = Array.isArray(existing) ? existing : []
      const map = {}
      for (const ex of existingList) {
        const cn = String(ex?.className || '').trim()
        if (!cn) continue
        map[cn] = ex
      }

      const classList = Array.isArray(classes) ? classes : []
      const missing = classList.filter((c) => {
        const cn = String(c?.name || '').trim()
        return cn && !map[cn]
      })

      if (missing.length && canManage) {
        const name = defaultExamName(examType, Number(year), examType === 'monthly' ? Number(month) : undefined)
        const createPayloads = missing.map((c) => {
          const cn = String(c?.name || '').trim()
          return {
            className: cn,
            type: examType,
            year: Number(year),
            ...(examType === 'monthly' ? { month: Number(month) } : {}),
            name,
            subjects: []
          }
        })

        const results = await Promise.allSettled(createPayloads.map((p) => examsService.createExam(p)))
        for (const r of results) {
          if (r.status !== 'fulfilled') continue
          const ex = r.value?.exam
          const cn = String(ex?.className || '').trim()
          if (cn) map[cn] = ex
        }
      }

      // Re-fetch (ensures we have the current saved subjects array for grid build)
      const { exams: refreshed } = await examsService.listExams({
        type: examType,
        year: Number(year),
        ...(examType === 'monthly' ? { month: Number(month) } : {})
      })
      const refreshedList = Array.isArray(refreshed) ? refreshed : []
      const freshMap = {}
      for (const ex of refreshedList) {
        const cn = String(ex?.className || '').trim()
        if (!cn) continue
        freshMap[cn] = ex
      }

      setExamsByClass(freshMap)
      buildGridFromExams({ classList, examMap: freshMap })

      setSuccess('Datesheet grid loaded')

      // Pre-load subjects for visible classes so dropdown is ready
      for (const c of visibleClasses) {
        // eslint-disable-next-line no-await-in-loop
        await ensureSubjectsLoaded(c?.name)
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to open grid')
    } finally {
      setBusy(false)
    }
  }

  function usedSubjectsForRow(className) {
    const row = grid[String(className || '').trim()] || {}
    const used = new Set(Object.values(row).filter(Boolean).map(String))
    return used
  }

  function updateCell({ className, iso, subjectId }) {
    const cn = String(className || '').trim()
    const dateIso = String(iso || '')
    const val = subjectId ? String(subjectId) : ''

    setGrid((prev) => {
      const next = { ...(prev || {}) }
      const row = { ...(next[cn] || {}) }

      // empty option clears
      if (!val) {
        delete row[dateIso]
        next[cn] = row
        return next
      }

      // enforce: a subject cannot appear in multiple cells for the same class
      for (const k of Object.keys(row)) {
        if (String(row[k]) === val && k !== dateIso) {
          delete row[k]
        }
      }

      row[dateIso] = val
      next[cn] = row
      return next
    })
  }

  function ensureFirstDate() {
    if (!firstDate) {
      setError('Please choose the first date')
      return
    }
    const iso = toISODate(firstDate)
    if (!iso) {
      setError('Invalid first date')
      return
    }

    setError('')
    setDates([iso])
  }

  function addNextDate() {
    if (!dates.length) {
      ensureFirstDate()
      return
    }
    const last = dates[dates.length - 1]
    const next = nextDateIso({ lastIso: last, skipSundays })
    if (!next) return
    setDates((prev) => {
      const list = Array.isArray(prev) ? [...prev] : []
      if (list.includes(next)) return list
      return [...list, next]
    })
  }

  function subjectNameLookup(className) {
    const list = subjectsByClass[String(className || '').trim()]
    const map = new Map()
    if (Array.isArray(list)) {
      for (const s of list) {
        if (!s?._id) continue
        map.set(String(s._id), String(s.name || ''))
      }
    }
    return map
  }

  function exportMatrix() {
    const cols = ['Class', ...dates.map((d) => `${d} (${dayLabel(d)})`)]
    const rows = []

    for (const c of visibleClasses) {
      const cn = String(c?.name || '').trim()
      if (!cn) continue
      const rowMap = grid[cn] || {}
      const nameMap = subjectNameLookup(cn)
      const row = [cn]
      for (const d of dates) {
        const subjId = rowMap[d] ? String(rowMap[d]) : ''
        row.push(subjId ? nameMap.get(subjId) || '' : '')
      }
      rows.push(row)
    }

    return [cols, ...rows]
  }

  function exportXlsx({ bookType }) {
    if (!dates.length) {
      setError('Please add at least one date column first')
      return
    }

    const matrix = exportMatrix()
    const ws = XLSX.utils.aoa_to_sheet(matrix)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Datesheet')

    const name = `datesheet_${examType}_${year}${examType === 'monthly' ? `_m${pad2(month)}` : ''}.${bookType}`
    const out = XLSX.write(wb, { bookType, type: 'array' })
    saveAs(new Blob([out], { type: 'application/octet-stream' }), name)
  }

  async function exportPdf() {
    if (!tableRef.current) return
    if (!dates.length) {
      setError('Please add at least one date column first')
      return
    }

    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 8

      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width

      let y = margin
      let remaining = imgH

      pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH)
      remaining -= pageH - margin * 2

      while (remaining > 0) {
        pdf.addPage()
        y = margin - (imgH - remaining)
        pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH)
        remaining -= pageH - margin * 2
      }

      const name = `datesheet_${examType}_${year}${examType === 'monthly' ? `_m${pad2(month)}` : ''}.pdf`
      pdf.save(name)
    } catch (e) {
      setError('Failed to export PDF')
    } finally {
      setBusy(false)
    }
  }

  function printPreview() {
    if (!dates.length) {
      setError('Please add at least one date column first')
      return
    }
    setError('')
    window.print()
  }

  async function saveDatesheets() {
    if (!canManage) return
    if (!dates.length) {
      setError('Please add at least one date column first')
      return
    }

    setError('')
    setSuccess('')
    setBusy(true)

    try {
      const classList = Array.isArray(visibleClasses) ? visibleClasses : []
      for (const c of classList) {
        const cn = String(c?.name || '').trim()
        if (!cn) continue

        const exam = examsByClass[cn]
        if (!exam?._id) continue

        if (String(exam.status) === 'published') continue

        const rowMap = grid[cn] || {}
        const selectedPairs = dates
          .map((d) => ({ iso: d, subjectId: rowMap[d] ? String(rowMap[d]) : '' }))
          .filter((x) => x.subjectId)

        const existingSubjects = Array.isArray(exam?.subjects) ? exam.subjects : []
        const bySubjectId = new Map()
        for (const s of existingSubjects) {
          const id = s?.subject?._id || s?.subject
          if (!id) continue
          bySubjectId.set(String(id), s)
        }

        const nextSubjects = selectedPairs.map(({ iso, subjectId }) => {
          const prev = bySubjectId.get(subjectId)
          const base = prev ? { ...prev } : { subject: subjectId }
          base.subject = subjectId
          base.date = new Date(`${iso}T00:00:00`)
          return base
        })

        // eslint-disable-next-line no-await-in-loop
        const { exam: updated } = await examsService.updateExam(exam._id, { subjects: nextSubjects })
        setExamsByClass((prev) => ({ ...prev, [cn]: updated }))
      }

      setSuccess('Datesheets saved')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save datesheets')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    loadBasics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!allowedTypes.includes(examType)) {
      setExamType(allowedTypes[0] || 'mid')
    }
  }, [allowedTypes, examType])

  useEffect(() => {
    if (examType !== 'monthly') return
    if (!allowedMonths.includes(Number(month))) {
      setMonth(allowedMonths[0] || 1)
    }
  }, [allowedMonths, examType, month])

  useEffect(() => {
    // reset grid when changing filters
    setDates([])
    setGrid({})
    setExamsByClass({})
    setSuccess('')
    setError('')
  }, [examType, year, month, viewMode, selectedClass])

  const hasGrid = useMemo(() => {
    return Object.keys(examsByClass || {}).length > 0
  }, [examsByClass])

  return (
    <div>
      {showHeader ? <PageHeader title={title} subtitle={subtitle} /> : null}

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <Card className="mt-6 no-print">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-sm font-medium">Exam Type</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <ToggleBox active={examType === 'mid'} onToggle={() => setExamType('mid')} disabled={!allowedTypes.includes('mid')}>Mids</ToggleBox>
              <ToggleBox active={examType === 'final'} onToggle={() => setExamType('final')} disabled={!allowedTypes.includes('final')}>Finals</ToggleBox>
              <ToggleBox active={examType === 'monthly'} onToggle={() => setExamType('monthly')} disabled={!allowedTypes.includes('monthly')}>Monthly Test</ToggleBox>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <div className="text-sm font-medium">Year</div>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value || currentYear))}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium">Month</div>
              <Select value={month} onChange={(e) => setMonth(Number(e.target.value || 1))} disabled={examType !== 'monthly'}>
                {monthOptions().filter((m) => allowedMonths.includes(m.value)).map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium">View</div>
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" variant={viewMode === 'full' ? 'primary' : 'secondary'} onClick={() => setViewMode('full')}>Full School</Button>
                <Button type="button" size="sm" variant={viewMode === 'class' ? 'primary' : 'secondary'} onClick={() => setViewMode('class')}>Class Wise</Button>
              </div>
            </div>
          </div>

          {viewMode === 'class' ? (
            <div>
              <div className="text-sm font-medium">Class</div>
              <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c?._id} value={c?.name}>{c?.name}</option>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <div className="text-sm font-medium">Dates</div>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <Input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
                <Button type="button" size="sm" onClick={ensureFirstDate} disabled={busy}>Set First Date</Button>
                <Button type="button" size="sm" onClick={addNextDate} disabled={busy}>Add Next Date</Button>
                <ToggleBox active={skipSundays} onToggle={setSkipSundays}>Skip Sundays</ToggleBox>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Dates are added sequentially (next day after the previous).
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button type="button" variant="primary" onClick={openOrCreateGrid} disabled={loading || busy || (viewMode === 'class' && !selectedClass)}>
                Open / Create Grid
              </Button>
              {canManage ? (
                <Button type="button" onClick={saveDatesheets} disabled={!hasGrid || busy}>Save</Button>
              ) : null}
            </div>

            <div className="flex items-end flex-wrap gap-2 justify-start sm:justify-end">
              <Button type="button" onClick={printPreview} disabled={!hasGrid || busy}>Print</Button>
              <Button type="button" onClick={exportPdf} disabled={!hasGrid || busy}>PDF</Button>
              <Button type="button" onClick={() => exportXlsx({ bookType: 'csv' })} disabled={!hasGrid || busy}>CSV</Button>
              <Button type="button" onClick={() => exportXlsx({ bookType: 'xlsx' })} disabled={!hasGrid || busy}>XLSX</Button>
            </div>
          </div>
        </div>
      </Card>

      {hasGrid ? (
        <div className="mt-6">
          <div className="text-sm text-gray-600 mb-2">
            Click a cell to assign a subject. Each subject can be used once per class row.
          </div>

          <div className="overflow-auto border rounded" ref={tableRef}>
            <table className="min-w-max w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="text-left px-3 py-2 border-b whitespace-nowrap">Class</th>
                  {dates.map((d) => (
                    <th key={d} className="text-center px-3 py-2 border-b whitespace-nowrap">
                      <div className="font-semibold">{dateLabel(d)}</div>
                      <div className="text-xs text-gray-600">{dayLabel(d)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleClasses.map((c) => {
                  const cn = String(c?.name || '').trim()
                  const exam = examsByClass[cn]
                  const readOnly = !canManage || String(exam?.status || '') === 'published'
                  const rowMap = grid[cn] || {}
                  const subjects = subjectsByClass[cn]
                  const used = usedSubjectsForRow(cn)

                  return (
                    <tr key={cn}>
                      <td className="px-3 py-2 border-b font-medium whitespace-nowrap">
                        <div>{cn}</div>
                        {String(exam?.status || '') === 'published' ? (
                          <div className="text-xs text-gray-600">Published (view only)</div>
                        ) : null}
                      </td>
                      {dates.map((d) => {
                        const val = rowMap[d] ? String(rowMap[d]) : ''
                        const options = Array.isArray(subjects) ? subjects : []
                        const nameMap = subjectNameLookup(cn)

                        return (
                          <td key={`${cn}__${d}`} className="px-2 py-2 border-b">
                            {readOnly ? (
                              <div className="min-w-[160px]">
                                {val ? nameMap.get(val) || '—' : '—'}
                              </div>
                            ) : (
                              <select
                                className="w-full border rounded px-2 py-1 bg-white"
                                value={val}
                                onFocus={() => ensureSubjectsLoaded(cn)}
                                onChange={(e) => updateCell({ className: cn, iso: d, subjectId: e.target.value })}
                              >
                                <option value=""></option>
                                {options
                                  .filter((s) => {
                                    const id = s?._id ? String(s._id) : ''
                                    if (!id) return false
                                    if (val && id === val) return true
                                    return !used.has(id)
                                  })
                                  .map((s) => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                  ))}
                              </select>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <style jsx global>{`
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              th, td { border: 1px solid #000 !important; }
            }
          `}</style>
        </div>
      ) : (
        <div className="mt-6 text-sm text-gray-600">
          {loading ? 'Loading…' : 'Select exam type/year (and month if monthly), then open the grid.'}
        </div>
      )}
    </div>
  )
}
