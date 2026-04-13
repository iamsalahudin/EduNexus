"use client"

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import examsService from '@/services/examsService'
import { Button, Card, Input, PageHeader, Select, Textarea } from '@/components/ui'

function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function parseDateOnly(dateStr) {
  if (!dateStr) return undefined
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function parseDateTimeLocal(dateStr) {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function monthLabel(m) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const idx = Number(m) - 1
  return idx >= 0 && idx < 12 ? names[idx] : ''
}

function addDays(isoString, days) {
  if (!isoString) return undefined
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return undefined
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString()
}

function nextMinDateInput(prevIsoDate) {
  const nextIso = addDays(prevIsoDate, 1)
  return toDateInput(nextIso)
}

export default function ExamSchedulePage({
  title = 'Exam Schedule',
  subtitle = 'Create exams, set datesheet, and manage marks entry workflow.',
  canManage = false,
  marksEntryHref = ''
}) {
  const currentYear = new Date().getFullYear()

  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])

  const [className, setClassName] = useState('')
  const [year, setYear] = useState(currentYear)
  const [filterType, setFilterType] = useState('')
  const [createType, setCreateType] = useState('mid')

  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedExam, setSelectedExam] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [savingDatesheet, setSavingDatesheet] = useState(false)
  const [savingWindow, setSavingWindow] = useState(false)

  // Create form
  const [createName, setCreateName] = useState('')
  const [createMonth, setCreateMonth] = useState('')
  const [createInstructions, setCreateInstructions] = useState('')

  // Edit datesheet
  const [editInstructions, setEditInstructions] = useState('')
  const [editSubjects, setEditSubjects] = useState([])
  const [applyStartTime, setApplyStartTime] = useState('')
  const [applyDurationMinutes, setApplyDurationMinutes] = useState('')
  const [applyMaxMarks, setApplyMaxMarks] = useState('')
  const [applyPassingMarks, setApplyPassingMarks] = useState('')
  const [uploadOpensAt, setUploadOpensAt] = useState('')
  const [uploadClosesAt, setUploadClosesAt] = useState('')

  const classSections = useMemo(() => {
    const c = classes.find((x) => x?.name === className)
    return Array.isArray(c?.sections) ? c.sections : []
  }, [classes, className])

  async function loadAll({ keepSelected = true } = {}) {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const [{ classes: cls }, { exams: ex }] = await Promise.all([
        classesService.listClasses(),
        examsService.listExams({
          year: year || undefined,
          className: className || undefined,
          type: filterType || undefined,
        })
      ])
      setClasses(Array.isArray(cls) ? cls : [])
      setExams(Array.isArray(ex) ? ex : [])

      if (!keepSelected) {
        setSelectedExamId('')
        setSelectedExam(null)
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load exam schedule')
    } finally {
      setLoading(false)
    }
  }

  async function loadExamDetails(id) {
    if (!id) {
      setSelectedExam(null)
      return
    }
    setError('')
    setSuccess('')
    try {
      const { exam } = await examsService.getExam(id)
      setSelectedExam(exam)
      setEditInstructions(exam?.instructions || '')
      setEditSubjects(Array.isArray(exam?.subjects) ? exam.subjects : [])
      setUploadOpensAt(toDateTimeLocal(exam?.marksEntry?.uploadOpensAt))
      setUploadClosesAt(toDateTimeLocal(exam?.marksEntry?.uploadClosesAt))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load exam')
    }
  }

  async function loadSubjectsForClass(name) {
    if (!name) {
      setAvailableSubjects([])
      return
    }
    try {
      const { subjects } = await subjectsService.listSubjects({ className: name })
      setAvailableSubjects(Array.isArray(subjects) ? subjects : [])
    } catch {
      setAvailableSubjects([])
    }
  }

  useEffect(() => {
    loadAll({ keepSelected: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadAll({ keepSelected: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className, year, filterType])

  useEffect(() => {
    if (!selectedExamId) return
    loadExamDetails(selectedExamId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId])

  useEffect(() => {
    const sourceClass = selectedExam?.className || className
    loadSubjectsForClass(sourceClass)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExam?.className, className])

  useEffect(() => {
    if (createName) return
    if (!createType) return
    const base = createType === 'monthly' ? 'Monthly Test' : createType === 'mid' ? 'Mid Term' : createType === 'final' ? 'Final Term' : 'Exam'
    setCreateName(`${base} (${year})`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createType, year])

  async function createExam() {
    if (!canManage) return
    if (!className) {
      setError('Please select a class')
      return
    }

    setError('')
    setSuccess('')
    try {
      const { subjects } = await subjectsService.listSubjects({ className })
      const subjectRows = Array.isArray(subjects) ? subjects : []
      setAvailableSubjects(subjectRows)

      const payload = {
        className,
        type: createType,
        name: String(createName || '').trim() || 'Exam',
        year: Number(year),
        ...(createType === 'monthly' && createMonth ? { month: Number(createMonth) } : {}),
        instructions: createInstructions || '',
        subjects: subjectRows.map((s) => ({ subject: s?._id }))
      }

      const { exam, reused, reusedFrom } = await examsService.createExam(payload)
      const reusedMsg = reused
        ? reusedFrom === 'draft' || exam?.status === 'draft'
          ? 'Exam already exists — opened the latest draft.'
          : 'Exam already exists — opened the existing exam.'
        : 'Exam created'
      setSuccess(reusedMsg)
      await loadAll({ keepSelected: false })
      setSelectedExamId(exam?._id || '')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create exam')
    }
  }

  async function clearDatesheet() {
    if (!canManage || !selectedExam?._id) return
    if (!canEditExam) return
    const ok = window.confirm('Delete this datesheet? This will clear all dates/time/marks for every paper.')
    if (!ok) return

    setError('')
    setSuccess('')
    setSavingDatesheet(true)
    try {
      const sourceSubjects = (editSubjects?.length ? editSubjects : selectedExam?.subjects) || []
      const missingIdx = sourceSubjects.findIndex((s) => !(s?.subject?._id || s?.subject))
      if (missingIdx >= 0) {
        setError(`Please select a subject for row ${missingIdx + 1} before deleting.`)
        return
      }

      const payload = {
        instructions: '',
        subjects: sourceSubjects.map((s) => ({
          subject: s?.subject?._id || s?.subject,
          startTime: '',
        }))
      }

      const { exam } = await examsService.updateExam(selectedExam._id, payload)
      setSuccess('Datesheet deleted')
      setSelectedExam(exam)
      await loadExamDetails(selectedExam._id)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete datesheet')
    } finally {
      setSavingDatesheet(false)
    }
  }

  function updateSubjectField(index, field, value) {
    setEditSubjects((prev) => {
      const next = Array.isArray(prev) ? [...prev] : []
      const row = { ...(next[index] || {}) }
      row[field] = value
      next[index] = row

      if (field === 'date') {
        for (let i = index + 1; i < next.length; i++) {
          const prevDate = next[i - 1]?.date
          const curDate = next[i]?.date
          if (!prevDate || !curDate) continue

          const minIso = addDays(prevDate, 1)
          const minMs = minIso ? new Date(minIso).getTime() : NaN
          const curMs = new Date(curDate).getTime()

          if (!Number.isFinite(minMs) || Number.isNaN(curMs) || curMs < minMs) {
            next[i] = { ...(next[i] || {}), date: undefined }
          }
        }
      }
      return next
    })
  }

  const subjectOptions = useMemo(() => {
    const list = Array.isArray(availableSubjects) ? [...availableSubjects] : []
    list.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
    return list
  }, [availableSubjects])

  function applyToAllSubjects() {
    setEditSubjects((prev) => {
      const next = Array.isArray(prev) ? prev.map((s) => ({ ...(s || {}) })) : []
      return next.map((s) => ({
        ...s,
        ...(applyStartTime ? { startTime: applyStartTime } : {}),
        ...(applyDurationMinutes !== '' && applyDurationMinutes !== null && typeof applyDurationMinutes !== 'undefined'
          ? { durationMinutes: Number(applyDurationMinutes) }
          : {}),
        ...(applyMaxMarks !== '' && applyMaxMarks !== null && typeof applyMaxMarks !== 'undefined'
          ? { maxMarks: Number(applyMaxMarks) }
          : {}),
        ...(applyPassingMarks !== '' && applyPassingMarks !== null && typeof applyPassingMarks !== 'undefined'
          ? { passingMarks: Number(applyPassingMarks) }
          : {}),
      }))
    })
  }

  async function saveDatesheet() {
    if (!canManage || !selectedExam?._id) return
    setError('')
    setSuccess('')
    setSavingDatesheet(true)

    try {
      const missingIdx = (editSubjects || []).findIndex((s) => !(s?.subject?._id || s?.subject))
      if (missingIdx >= 0) {
        setError(`Please select a subject for row ${missingIdx + 1}.`)
        return
      }

      const payload = {
        instructions: editInstructions || '',
        subjects: (editSubjects || []).map((s) => ({
          subject: s?.subject?._id || s?.subject,
          date: s?.date ? s.date : undefined,
          startTime: s?.startTime || '',
          durationMinutes: s?.durationMinutes ? Number(s.durationMinutes) : undefined,
          maxMarks: s?.maxMarks ? Number(s.maxMarks) : undefined,
          passingMarks: typeof s?.passingMarks !== 'undefined' && s?.passingMarks !== '' && s?.passingMarks !== null ? Number(s.passingMarks) : undefined,
          theoryMax: typeof s?.theoryMax !== 'undefined' && s?.theoryMax !== '' && s?.theoryMax !== null ? Number(s.theoryMax) : undefined,
          practicalMax: typeof s?.practicalMax !== 'undefined' && s?.practicalMax !== '' && s?.practicalMax !== null ? Number(s.practicalMax) : undefined,
        }))
      }

      const { exam } = await examsService.updateExam(selectedExam._id, payload)
      setSuccess('Datesheet saved')
      setSelectedExam(exam)
      await loadExamDetails(selectedExam._id)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save datesheet')
    } finally {
      setSavingDatesheet(false)
    }
  }

  async function saveMarksWindow() {
    if (!canManage || !selectedExam?._id) return
    setError('')
    setSuccess('')
    setSavingWindow(true)
    try {
      const payload = {
        marksEntry: {
          uploadOpensAt: parseDateTimeLocal(uploadOpensAt),
          uploadClosesAt: parseDateTimeLocal(uploadClosesAt)
        }
      }
      const { exam } = await examsService.updateExam(selectedExam._id, payload)
      setSuccess('Marks entry window saved')
      setSelectedExam(exam)
      await loadExamDetails(selectedExam._id)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save window')
    } finally {
      setSavingWindow(false)
    }
  }

  async function doAction(action) {
    if (!canManage || !selectedExam?._id) return
    setError('')
    setSuccess('')

    try {
      const fn = action === 'open'
        ? examsService.openExam
        : action === 'lock'
          ? examsService.lockExam
          : action === 'approve'
            ? examsService.approveExam
            : examsService.publishExam

      if (action === 'publish') {
        const ok = window.confirm('Publish this exam? This will freeze marks entry.')
        if (!ok) return
      }

      await fn(selectedExam._id)
      const msg = action === 'open'
        ? 'Exam opened'
        : action === 'lock'
          ? 'Exam locked'
          : action === 'approve'
            ? 'Exam approved'
            : 'Exam published'
      setSuccess(msg)
      await loadExamDetails(selectedExam._id)
      await loadAll({ keepSelected: true })
    } catch (e) {
      setError(e?.response?.data?.error || `Failed to ${action} exam`)
    }
  }

  const examStatus = selectedExam?.status
  const canOpen = canManage && selectedExam?._id && examStatus !== 'published'
  const canLock = canManage && selectedExam?._id && examStatus === 'open'
  const canApprove = canManage && selectedExam?._id && examStatus === 'submitted'
  const canPublish = canManage && selectedExam?._id && examStatus === 'approved'

  const isPastExam = useMemo(() => {
    if (!selectedExam) return false
    if (Number(selectedExam?.year) && Number(selectedExam.year) < currentYear) return true

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()

    const dates = (selectedExam?.subjects || [])
      .map((s) => (s?.date ? new Date(s.date).getTime() : NaN))
      .filter((t) => Number.isFinite(t))
    if (!dates.length) return false
    const endMs = Math.max(...dates)
    return Number.isFinite(endMs) ? endMs < todayStartMs : false
  }, [selectedExam, currentYear])

  const canEditExam = canManage && selectedExam?._id && !isPastExam && examStatus !== 'approved' && examStatus !== 'published'

  const readOnlyReason = useMemo(() => {
    if (!selectedExam?._id) return ''
    if (!canManage) return ''
    if (!canEditExam) {
      if (isPastExam) return 'This is a past exam. Past exams cannot be edited.'
      if (examStatus === 'published') return 'This exam is published and cannot be edited.'
      if (examStatus === 'approved') return 'This exam is approved and is read-only.'
      return 'Editing is disabled for this exam.'
    }
    return ''
  }, [selectedExam?._id, canManage, canEditExam, isPastExam, examStatus])

  const groupedExams = useMemo(() => {
    const items = Array.isArray(exams) ? [...exams] : []
    const groups = {
      mid: [],
      final: [],
      monthly: [],
      custom: [],
    }

    for (const ex of items) {
      const t = ex?.type
      if (t === 'mid') groups.mid.push(ex)
      else if (t === 'final') groups.final.push(ex)
      else if (t === 'monthly') groups.monthly.push(ex)
      else groups.custom.push(ex)
    }

    const byClassThenName = (a, b) => {
      const ac = String(a?.className || '')
      const bc = String(b?.className || '')
      if (ac !== bc) return ac.localeCompare(bc)
      return String(a?.name || '').localeCompare(String(b?.name || ''))
    }

    groups.mid.sort(byClassThenName)
    groups.final.sort(byClassThenName)
    groups.custom.sort(byClassThenName)
    groups.monthly.sort((a, b) => {
      const am = Number(a?.month || 0)
      const bm = Number(b?.month || 0)
      if (am !== bm) return am - bm
      return byClassThenName(a, b)
    })

    return groups
  }, [exams])

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {canManage ? (
          <Card>
            <h2 className="font-medium">Create Exam</h2>
            <p className="text-sm text-gray-600 mt-1">Creates an exam instance and auto-adds all subjects of the class.</p>

            {!className ? (
              <div className="mt-2 text-sm text-gray-600">
                Select a class from the Exams panel to create an exam.
              </div>
            ) : null}

            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={createType} onChange={(e) => setCreateType(e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="mid">Mid</option>
                  <option value="final">Final</option>
                  <option value="custom">Custom</option>
                </Select>
                <Select value={className} onChange={(e) => setClassName(e.target.value)}>
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c?._id} value={c?.name}>{c?.name}</option>
                  ))}
                </Select>
              </div>

              {createType === 'monthly' ? (
                <Select value={createMonth} onChange={(e) => setCreateMonth(e.target.value)}>
                  <option value="">Select month</option>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{monthLabel(i + 1)}</option>
                  ))}
                </Select>
              ) : null}

              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Exam name" />
              <Textarea value={createInstructions} onChange={(e) => setCreateInstructions(e.target.value)} placeholder="Instructions (optional)" />

              <Button type="button" variant="primary" onClick={createExam} disabled={loading || !className}>Create</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="font-medium">Notes</h2>
            <p className="text-sm text-gray-600 mt-1">You can view exam schedules and datesheets here.</p>
          </Card>
        )}

        <Card>
          <h2 className="font-medium">Exams</h2>
          <div className="mt-3 space-y-2">
            <Select value={className} onChange={(e) => setClassName(e.target.value)}>
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c?._id} value={c?.name}>{c?.name}</option>
              ))}
            </Select>

            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All types</option>
              <option value="mid">Mid</option>
              <option value="final">Final</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </Select>

            <div className="flex gap-2">
              <Button type="button" onClick={() => loadAll({ keepSelected: true })} disabled={loading}>Refresh</Button>
              {marksEntryHref ? (
                <Button type="button" variant="primary" onClick={() => (window.location.href = marksEntryHref)}>Marks Entry</Button>
              ) : null}
            </div>

            <Select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
              <option value="">Select exam</option>
              {filterType !== 'monthly' && (!filterType || filterType === 'mid') && groupedExams.mid.length ? (
                <optgroup label="Mid">
                  {groupedExams.mid.map((ex) => (
                    <option key={ex?._id} value={ex?._id}>
                      {ex?.className} — {ex?.name} ({ex?.status})
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {filterType !== 'monthly' && (!filterType || filterType === 'final') && groupedExams.final.length ? (
                <optgroup label="Final">
                  {groupedExams.final.map((ex) => (
                    <option key={ex?._id} value={ex?._id}>
                      {ex?.className} — {ex?.name} ({ex?.status})
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {(!filterType || filterType === 'monthly') && groupedExams.monthly.length ? (
                <optgroup label="Monthly">
                  {groupedExams.monthly.map((ex) => (
                    <option key={ex?._id} value={ex?._id}>
                      {ex?.className} — {ex?.name}{ex?.month ? ` • ${monthLabel(ex.month)}` : ''} ({ex?.status})
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {(!filterType || filterType === 'custom') && groupedExams.custom.length ? (
                <optgroup label="Custom">
                  {groupedExams.custom.map((ex) => (
                    <option key={ex?._id} value={ex?._id}>
                      {ex?.className} — {ex?.name} ({ex?.status})
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </Select>
          </div>

          {!selectedExam ? (
            <div className="mt-3 text-sm text-gray-600">Pick an exam to see datesheet.</div>
          ) : (
            <div className="mt-3 text-sm text-gray-600">
              <div>Class: <span className="font-medium">{selectedExam.className}</span></div>
              <div>Type: <span className="font-medium">{selectedExam.type}</span></div>
              <div>Year: <span className="font-medium">{selectedExam.year}</span>{selectedExam.month ? ` • Month: ${monthLabel(selectedExam.month)}` : ''}</div>
              <div>Status: <span className="font-medium">{selectedExam.status}</span></div>
              {canManage && !canEditExam ? (
                <div className="mt-1">Editing: <span className="font-medium">Read-only</span></div>
              ) : null}
            </div>
          )}
        </Card>
      </div>

      {selectedExam ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">Datesheet</h2>
                <p className="text-sm text-gray-600 mt-1">Set date/time per subject.</p>
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <Button type="button" onClick={clearDatesheet} disabled={!canEditExam || savingDatesheet}>
                    Delete Datesheet
                  </Button>
                  <Button type="button" variant="primary" onClick={saveDatesheet} disabled={!canEditExam || savingDatesheet}>
                    {savingDatesheet ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              ) : null}
            </div>

            {readOnlyReason ? (
              <div className="mt-2 text-sm text-gray-600">{readOnlyReason}</div>
            ) : null}

            <div className="mt-3">
              <Textarea value={editInstructions} onChange={(e) => setEditInstructions(e.target.value)} placeholder="Exam instructions" disabled={!canEditExam} />
            </div>

            {canManage ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-2">
                <Input
                  type="time"
                  value={applyStartTime}
                  onChange={(e) => setApplyStartTime(e.target.value)}
                  disabled={!canEditExam}
                  placeholder="Start"
                />
                <Input
                  type="number"
                  value={applyDurationMinutes}
                  onChange={(e) => setApplyDurationMinutes(e.target.value)}
                  disabled={!canEditExam}
                  placeholder="Duration (min)"
                />
                <Input
                  type="number"
                  value={applyMaxMarks}
                  onChange={(e) => setApplyMaxMarks(e.target.value)}
                  disabled={!canEditExam}
                  placeholder="Marks"
                />
                <Input
                  type="number"
                  value={applyPassingMarks}
                  onChange={(e) => setApplyPassingMarks(e.target.value)}
                  disabled={!canEditExam}
                  placeholder="Pass"
                />
                <Button type="button" onClick={applyToAllSubjects} disabled={!canEditExam}>
                  Apply to all
                </Button>
              </div>
            ) : null}

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Start</th>
                    <th className="py-2 pr-3">Dur (min)</th>
                    <th className="py-2 pr-3">Marks</th>
                    <th className="py-2 pr-3">Pass</th>
                  </tr>
                </thead>
                <tbody>
                  {(editSubjects || []).map((s, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="py-2 pr-3" style={{ minWidth: 220 }}>
                        {canEditExam ? (
                          <Select
                            value={String(s?.subject?._id || s?.subject || '')}
                            onChange={(e) => updateSubjectField(idx, 'subject', e.target.value)}
                            disabled={!canEditExam}
                          >
                            <option value="">Select subject</option>
                            {subjectOptions.map((subj) => (
                              <option key={subj?._id} value={subj?._id}>{subj?.name}</option>
                            ))}
                          </Select>
                        ) : (
                          <div>
                            {s?.subject?.name || subjectOptions.find((x) => String(x?._id) === String(s?.subject))?.name || '—'}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3" style={{ minWidth: 140 }}>
                        <Input
                          type="date"
                          value={toDateInput(s?.date)}
                          disabled={!canEditExam || (idx > 0 && !editSubjects?.[idx - 1]?.date)}
                          min={idx > 0 && editSubjects?.[idx - 1]?.date ? nextMinDateInput(editSubjects[idx - 1].date) : undefined}
                          onChange={(e) => updateSubjectField(idx, 'date', parseDateOnly(e.target.value))}
                        />
                      </td>
                      <td className="py-2 pr-3" style={{ minWidth: 120 }}>
                        <Input
                          type="time"
                          value={s?.startTime || ''}
                          disabled={!canEditExam}
                          onChange={(e) => updateSubjectField(idx, 'startTime', e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-3" style={{ minWidth: 120 }}>
                        <Input
                          type="number"
                          value={s?.durationMinutes ?? ''}
                          disabled={!canEditExam}
                          onChange={(e) => updateSubjectField(idx, 'durationMinutes', e.target.value)}
                          placeholder="e.g. 90"
                        />
                      </td>
                      <td className="py-2 pr-3" style={{ minWidth: 110 }}>
                        <Input
                          type="number"
                          value={s?.maxMarks ?? ''}
                          disabled={!canEditExam}
                          onChange={(e) => updateSubjectField(idx, 'maxMarks', e.target.value)}
                          placeholder="e.g. 100"
                        />
                      </td>
                      <td className="py-2 pr-3" style={{ minWidth: 110 }}>
                        <Input
                          type="number"
                          value={s?.passingMarks ?? ''}
                          disabled={!canEditExam}
                          onChange={(e) => updateSubjectField(idx, 'passingMarks', e.target.value)}
                          placeholder="e.g. 33"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="font-medium">Marks Entry Window & Workflow</h2>
            <p className="text-sm text-gray-600 mt-1">Admin/Principal can open, lock, approve, and publish.</p>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <Input type="datetime-local" value={uploadOpensAt} onChange={(e) => setUploadOpensAt(e.target.value)} disabled={!canEditExam} />
              <div className="hidden sm:block text-sm text-gray-600 text-center">to</div>
              <Input type="datetime-local" value={uploadClosesAt} onChange={(e) => setUploadClosesAt(e.target.value)} disabled={!canEditExam} />
            </div>

            {canManage ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" onClick={saveMarksWindow} disabled={!canEditExam || savingWindow}>
                  {savingWindow ? 'Saving…' : 'Save Window'}
                </Button>
                <Button type="button" onClick={() => doAction('open')} disabled={!canOpen}>Open</Button>
                <Button type="button" onClick={() => doAction('lock')} disabled={!canLock}>Lock</Button>
                <Button type="button" onClick={() => doAction('approve')} disabled={!canApprove}>Approve</Button>
                <Button type="button" variant="primary" onClick={() => doAction('publish')} disabled={!canPublish}>Publish</Button>
              </div>
            ) : (
              <div className="mt-3 text-sm text-gray-600">Open: {uploadOpensAt || '—'} • Close: {uploadClosesAt || '—'}</div>
            )}

            {selectedExam?.type === 'monthly' && classSections?.length ? (
              <div className="mt-4 text-xs text-gray-600">
                Tip: Monthly tests are often section-wise. Sections for this class: {classSections.join(', ')}
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}
    </div>
  )
}
