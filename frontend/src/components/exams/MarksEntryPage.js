<<<<<<< HEAD
"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import classesService from '@/services/classesService'
import examsService from '@/services/examsService'
import { Button, Card, Input, PageHeader, Select, ToggleBox } from '@/components/ui'

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function monthLabel(m) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const idx = Number(m) - 1
  return idx >= 0 && idx < 12 ? names[idx] : ''
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function buildYears(currentYear) {
  const out = []
  for (let y = currentYear - 2; y <= currentYear + 1; y++) out.push(y)
  return out
}

export default function MarksEntryPage({
  title = 'Marks Entry',
  subtitle = 'Enter subject-wise marks for an exam.',
  mode = 'admin' // 'admin' | 'teacher'
}) {
  const currentYear = new Date().getFullYear()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [year, setYear] = useState(currentYear)
  const [classes, setClasses] = useState([])
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')

  const [assignments, setAssignments] = useState([])

  const [exams, setExams] = useState([])
  const [examId, setExamId] = useState('')
  const [exam, setExam] = useState(null)

  const [subjects, setSubjects] = useState([]) // { _id, name }
  const [students, setStudents] = useState([]) // { _id, name, studentId }

  // marks[studentId][subjectId] = { marks, theoryMarks, practicalMarks }
  const [marks, setMarks] = useState({})
  const [constraintsBySubject, setConstraintsBySubject] = useState({})
  const [canEditBySubject, setCanEditBySubject] = useState({})

  const [view, setView] = useState('edit') // 'view' | 'edit'

  const tableRef = useRef(null)

  const years = useMemo(() => buildYears(currentYear), [currentYear])

  const classSections = useMemo(() => {
    const c = classes.find((x) => x?.name === className)
    return Array.isArray(c?.sections) ? c.sections : []
  }, [classes, className])

  const teacherClasses = useMemo(() => {
    if (mode !== 'teacher') return []
    const set = new Set(assignments.map((a) => a?.className).filter(Boolean))
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))
  }, [assignments, mode])

  const teacherSections = useMemo(() => {
    if (mode !== 'teacher') return []
    const set = new Set(
      assignments
        .filter((a) => a?.className === className)
        .map((a) => a?.section)
        .filter((s) => s !== undefined)
    )
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))
  }, [assignments, className, mode])

  const teacherSubjectSet = useMemo(() => {
    if (mode !== 'teacher') return new Set()
    const set = new Set(
      assignments
        .filter((a) => a?.className === className && String(a?.section || '') === String(section || ''))
        .map((a) => a?.subject?._id)
        .filter(Boolean)
        .map(String)
    )
    return set
  }, [assignments, className, section, mode])

  async function loadBasics() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { classes: cls } = await classesService.listClasses()
      const list = Array.isArray(cls) ? cls : []
      list.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
      setClasses(list)

      if (mode === 'teacher') {
        const { assignments: a } = await examsService.getTeacherAssignments({ year })
        setAssignments(Array.isArray(a) ? a : [])
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function loadExamsForClass() {
    if (!className || !year) {
      setExams([])
      setExamId('')
      return
    }
    try {
      const { exams: ex } = await examsService.listExams({ className, year: Number(year) })
      const list = Array.isArray(ex) ? [...ex] : []
      list.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
      setExams(list)
      if (!list.find((x) => x?._id === examId)) {
        setExamId('')
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load exams')
    }
  }

  function resetGrid() {
    setExam(null)
    setSubjects([])
    setStudents([])
    setMarks({})
    setConstraintsBySubject({})
    setCanEditBySubject({})
    setSuccess('')
  }

  async function loadGrid() {
    if (!examId) return
    if (!className) {
      setError('Please select a class')
      return
    }
    if (!section) {
      setError('Please select a section')
      return
    }

    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const { exam: ex } = await examsService.getExam(examId)
      setExam(ex)

      const subjList = (ex?.subjects || [])
        .map((s) => s?.subject)
        .filter(Boolean)
        .map((s) => ({ _id: s?._id || s, name: s?.name || '' }))
        .filter((s) => s._id)

      const unique = []
      const seen = new Set()
      for (const s of subjList) {
        const id = String(s._id)
        if (seen.has(id)) continue
        seen.add(id)
        unique.push({ _id: id, name: String(s.name || '') })
      }
      unique.sort((a, b) => String(a.name).localeCompare(String(b.name)))
      setSubjects(unique)

      if (!unique.length) {
        resetGrid()
        setExam(ex)
        setSuccess('Exam has no subjects in datesheet yet')
        return
      }

      const sheets = await Promise.all(
        unique.map((s) => examsService.getMarksSheet(examId, { subjectId: s._id, section }))
      )

      const studentsRows = (sheets[0]?.rows || []).map((r) => ({
        _id: r?.student?._id,
        name: `${r?.student?.firstName || ''} ${r?.student?.lastName || ''}`.trim(),
        studentId: r?.student?.studentId || ''
      })).filter((s) => s._id)

      setStudents(studentsRows)

      const nextMarks = {}
      const nextConstraints = {}
      const nextCanEdit = {}

      for (let i = 0; i < unique.length; i++) {
        const subject = unique[i]
        const sheet = sheets[i]
        nextConstraints[subject._id] = sheet?.constraints || {}
        nextCanEdit[subject._id] = !!sheet?.canEdit

        for (const row of sheet?.rows || []) {
          const stId = row?.student?._id
          if (!stId) continue
          const studentKey = String(stId)
          if (!nextMarks[studentKey]) nextMarks[studentKey] = {}
          nextMarks[studentKey][subject._id] = {
            marks: typeof row?.marks?.marks === 'number' ? row.marks.marks : '',
            theoryMarks: typeof row?.marks?.theoryMarks === 'number' ? row.marks.theoryMarks : '',
            practicalMarks: typeof row?.marks?.practicalMarks === 'number' ? row.marks.practicalMarks : ''
          }
        }
      }

      setMarks(nextMarks)
      setConstraintsBySubject(nextConstraints)
      setCanEditBySubject(nextCanEdit)
      setSuccess('Marks grid loaded')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load marks grid')
    } finally {
      setBusy(false)
    }
  }

  function canEditCell(subjectId) {
    const base = !!canEditBySubject[String(subjectId)]
    if (!base) return false
    if (view !== 'edit') return false
    if (mode !== 'teacher') return true
    return teacherSubjectSet.has(String(subjectId))
  }

  function updateMark(studentId, subjectId, field, value) {
    const st = String(studentId)
    const sub = String(subjectId)
    setMarks((prev) => {
      const next = { ...(prev || {}) }
      const row = { ...(next[st] || {}) }
      const cell = { ...(row[sub] || {}) }
      cell[field] = value
      row[sub] = cell
      next[st] = row
      return next
    })
  }

  async function save() {
    if (!examId || !section || !subjects.length) return
    if (view !== 'edit') return

    setError('')
    setSuccess('')
    setBusy(true)

    try {
      for (const subj of subjects) {
        const subjectId = String(subj._id)
        if (!canEditBySubject[subjectId]) continue
        if (mode === 'teacher' && !teacherSubjectSet.has(subjectId)) continue

        const constraints = constraintsBySubject[subjectId] || {}
        const showTheory = typeof constraints?.theoryMax === 'number' && constraints.theoryMax > 0
        const showPractical = typeof constraints?.practicalMax === 'number' && constraints.practicalMax > 0

        const payloadRows = students.map((s) => {
          const cell = marks?.[String(s._id)]?.[subjectId] || {}
          return {
            student: s._id,
            marks: cell.marks === '' ? null : Number(cell.marks),
            ...(showTheory ? { theoryMarks: cell.theoryMarks === '' ? null : Number(cell.theoryMarks) } : {}),
            ...(showPractical ? { practicalMarks: cell.practicalMarks === '' ? null : Number(cell.practicalMarks) } : {})
          }
        })

        // eslint-disable-next-line no-await-in-loop
        await examsService.upsertMarks(examId, { subjectId, section }, { rows: payloadRows })
      }

      setSuccess('Marks saved')
      await loadGrid()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save marks')
    } finally {
      setBusy(false)
    }
  }

  async function submitExam() {
    if (mode !== 'teacher') return
    if (!exam?._id) return
    if (exam?.status !== 'open') {
      setError('Only open exams can be submitted.')
      return
    }
    const ok = window.confirm('Submit this exam? This will lock marks entry for teachers.')
    if (!ok) return
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      await examsService.submitExam(exam._id)
      setSuccess('Submitted')
      await loadGrid()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to submit')
    } finally {
      setBusy(false)
    }
  }

  function exportMatrix({ bookType }) {
    if (!students.length || !subjects.length) return

    const header = ['Student', 'ID']
    const subjectCols = []
    for (const s of subjects) {
      const id = String(s._id)
      const constraints = constraintsBySubject[id] || {}
      const showTheory = typeof constraints?.theoryMax === 'number' && constraints.theoryMax > 0
      const showPractical = typeof constraints?.practicalMax === 'number' && constraints.practicalMax > 0

      if (showTheory || showPractical) {
        if (showTheory) subjectCols.push({ id, label: `${s.name} (T)`, field: 'theoryMarks' })
        if (showPractical) subjectCols.push({ id, label: `${s.name} (P)`, field: 'practicalMarks' })
        subjectCols.push({ id, label: `${s.name} (Total)`, field: 'marks' })
      } else {
        subjectCols.push({ id, label: s.name, field: 'marks' })
      }
    }
    for (const c of subjectCols) header.push(c.label)

    const rows = students.map((st) => {
      const r = [st.name, st.studentId]
      for (const c of subjectCols) {
        const cell = marks?.[String(st._id)]?.[String(c.id)] || {}
        r.push(cell[c.field] ?? '')
      }
      return r
    })

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Marks')

    const fileName = `marks_${className}_${section}_${year}_${String(exam?.type || 'exam')}${exam?.month ? `_m${pad2(exam.month)}` : ''}.${bookType}`
    const out = XLSX.write(wb, { bookType, type: 'array' })
    saveAs(new Blob([out], { type: 'application/octet-stream' }), fileName)
  }

  async function exportPdf() {
    if (!tableRef.current) return
    if (!students.length || !subjects.length) return

    setError('')
    setBusy(true)
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 8
      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width

      let remaining = imgH
      pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH)
      remaining -= pageH - margin * 2

      while (remaining > 0) {
        pdf.addPage()
        const y = margin - (imgH - remaining)
        pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH)
        remaining -= pageH - margin * 2
      }

      const fileName = `marks_${className}_${section}_${year}.pdf`
      pdf.save(fileName)
    } catch {
      setError('Failed to export PDF')
    } finally {
      setBusy(false)
    }
  }

  function printPreview() {
    if (!students.length || !subjects.length) return
    window.print()
  }

  // Loaders
  useEffect(() => {
    loadBasics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mode !== 'teacher') return
    loadBasics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  useEffect(() => {
    setExamId('')
    resetGrid()
    loadExamsForClass()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className, year])

  useEffect(() => {
    resetGrid()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, section])

  const upcomingExams = useMemo(() => {
    const list = Array.isArray(exams) ? [...exams] : []
    list.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
    return list.slice(0, 5)
  }, [exams])

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 no-print">
        <Card>
          <h2 className="font-medium">Selection</h2>
          <div className="mt-3 space-y-2">
            <Select value={year} onChange={(e) => setYear(Number(e.target.value || currentYear))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>

            {mode === 'teacher' ? (
              <Select value={className} onChange={(e) => setClassName(e.target.value)}>
                <option value="">Select class</option>
                {teacherClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            ) : (
              <Select value={className} onChange={(e) => setClassName(e.target.value)}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c?._id} value={c?.name}>{c?.name}</option>
                ))}
              </Select>
            )}

            {mode === 'teacher' ? (
              <Select value={section} onChange={(e) => setSection(e.target.value)} disabled={!className}>
                <option value="">Select section</option>
                {teacherSections.map((s) => (
                  <option key={String(s)} value={String(s)}>{String(s) || '—'}</option>
                ))}
              </Select>
            ) : (
              <Select value={section} onChange={(e) => setSection(e.target.value)} disabled={!className}>
                <option value="">Select section</option>
                {classSections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            )}

            <Select value={examId} onChange={(e) => setExamId(e.target.value)} disabled={!className || !year}>
              <option value="">Select exam</option>
              {exams.map((ex) => (
                <option key={ex?._id} value={ex?._id}>
                  {ex?.name} ({ex?.status}){ex?.month ? ` • ${monthLabel(ex.month)}` : ''}
                </option>
              ))}
            </Select>

            <div className="flex gap-2">
              <Button type="button" onClick={loadGrid} disabled={busy || !examId || !section}>Load</Button>
              <Button type="button" variant="primary" onClick={save} disabled={busy || view !== 'edit'}>Save</Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <h2 className="font-medium">Options</h2>
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={view === 'view' ? 'primary' : 'secondary'} onClick={() => setView('view')}>View</Button>
              <Button type="button" size="sm" variant={view === 'edit' ? 'primary' : 'secondary'} onClick={() => setView('edit')}>Edit</Button>
            </div>
            <div className="text-xs text-gray-600">
              {mode === 'teacher' ? 'Teachers can edit only their assigned subjects (and only if the window is open).' : 'Admin/Principal can edit while allowed by workflow.'}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={printPreview} disabled={!students.length}>Print</Button>
              <Button type="button" onClick={exportPdf} disabled={!students.length}>PDF</Button>
              <Button type="button" onClick={() => exportMatrix({ bookType: 'csv' })} disabled={!students.length}>CSV</Button>
              <Button type="button" onClick={() => exportMatrix({ bookType: 'xlsx' })} disabled={!students.length}>XLSX</Button>
            </div>

            {mode === 'teacher' && exam?._id ? (
              <div>
                <Button type="button" onClick={submitExam} disabled={busy || exam?.status !== 'open'}>Submit</Button>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <h2 className="font-medium">Upcoming Exams</h2>
          <div className="mt-3 space-y-2 text-sm">
            {!className ? (
              <div className="text-gray-600">Select a class to see recent exams.</div>
            ) : !upcomingExams.length ? (
              <div className="text-gray-600">No exams found.</div>
            ) : (
              upcomingExams.map((ex) => (
                <div key={ex?._id} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{ex?.name}</div>
                    <div className="text-xs text-gray-600">{ex?.status}{ex?.month ? ` • ${monthLabel(ex.month)}` : ''}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">Marks Grid</h2>
            {exam ? (
              <p className="text-sm text-gray-600 mt-1">{exam.className} — {exam.name} • Section: {section} • Status: {exam.status}</p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">Select class, section, year and exam to load.</p>
            )}
          </div>
        </div>

        {!students.length || !subjects.length ? (
          <div className="mt-4 text-sm text-gray-600">No grid loaded.</div>
        ) : (
          <div className="mt-4 overflow-auto border rounded" ref={tableRef}>
            <table className="min-w-max w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-gray-600">
                  <th className="py-2 px-3 border-b whitespace-nowrap">Student</th>
                  <th className="py-2 px-3 border-b whitespace-nowrap">ID</th>
                  {subjects.map((s) => (
                    <th key={s._id} className="py-2 px-3 border-b whitespace-nowrap text-center">{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st._id} className="border-t border-gray-200">
                    <td className="py-2 px-3 whitespace-nowrap">{st.name}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{st.studentId}</td>
                    {subjects.map((s) => {
                      const subId = String(s._id)
                      const cell = marks?.[String(st._id)]?.[subId] || {}
                      const constraints = constraintsBySubject[subId] || {}
                      const showTheory = typeof constraints?.theoryMax === 'number' && constraints.theoryMax > 0
                      const showPractical = typeof constraints?.practicalMax === 'number' && constraints.practicalMax > 0
                      const editable = canEditCell(subId)

                      return (
                        <td key={`${st._id}__${subId}`} className="py-2 px-2" style={{ minWidth: 120 }}>
                          {showTheory || showPractical ? (
                            <div className="space-y-1">
                              {showTheory ? (
                                <Input
                                  type="number"
                                  placeholder="T"
                                  value={cell.theoryMarks ?? ''}
                                  disabled={!editable}
                                  onChange={(e) => updateMark(st._id, subId, 'theoryMarks', e.target.value)}
                                />
                              ) : null}
                              {showPractical ? (
                                <Input
                                  type="number"
                                  placeholder="P"
                                  value={cell.practicalMarks ?? ''}
                                  disabled={!editable}
                                  onChange={(e) => updateMark(st._id, subId, 'practicalMarks', e.target.value)}
                                />
                              ) : null}
                              <Input
                                type="number"
                                placeholder="Total"
                                value={cell.marks ?? ''}
                                disabled={!editable}
                                onChange={(e) => updateMark(st._id, subId, 'marks', e.target.value)}
                              />
                            </div>
                          ) : (
                            <Input
                              type="number"
                              value={cell.marks ?? ''}
                              disabled={!editable}
                              onChange={(e) => updateMark(st._id, subId, 'marks', e.target.value)}
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <style jsx global>{`
              @media print {
                .no-print { display: none !important; }
                body { background: white !important; }
                th, td { border: 1px solid #000 !important; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
              }
            `}</style>
          </div>
        )}
      </Card>
    </div>
  )
}
=======
"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import classesService from '@/services/classesService'
import examsService from '@/services/examsService'
import { Button, Card, Input, PageHeader, Select, ToggleBox } from '@/components/ui'

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function monthLabel(m) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const idx = Number(m) - 1
  return idx >= 0 && idx < 12 ? names[idx] : ''
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function buildYears(currentYear) {
  const out = []
  for (let y = currentYear - 2; y <= currentYear + 1; y++) out.push(y)
  return out
}

export default function MarksEntryPage({
  title = 'Marks Entry',
  subtitle = 'Enter subject-wise marks for an exam.',
  mode = 'admin' // 'admin' | 'teacher'
}) {
  const currentYear = new Date().getFullYear()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [year, setYear] = useState(currentYear)
  const [classes, setClasses] = useState([])
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')

  const [assignments, setAssignments] = useState([])

  const [exams, setExams] = useState([])
  const [examId, setExamId] = useState('')
  const [exam, setExam] = useState(null)

  const [subjects, setSubjects] = useState([]) // { _id, name }
  const [students, setStudents] = useState([]) // { _id, name, studentId }

  // marks[studentId][subjectId] = { marks, theoryMarks, practicalMarks }
  const [marks, setMarks] = useState({})
  const [constraintsBySubject, setConstraintsBySubject] = useState({})
  const [canEditBySubject, setCanEditBySubject] = useState({})

  const [view, setView] = useState('edit') // 'view' | 'edit'

  const tableRef = useRef(null)

  const years = useMemo(() => buildYears(currentYear), [currentYear])

  const classSections = useMemo(() => {
    const c = classes.find((x) => x?.name === className)
    return Array.isArray(c?.sections) ? c.sections : []
  }, [classes, className])

  const teacherClasses = useMemo(() => {
    if (mode !== 'teacher') return []
    const set = new Set(assignments.map((a) => a?.className).filter(Boolean))
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))
  }, [assignments, mode])

  const teacherSections = useMemo(() => {
    if (mode !== 'teacher') return []
    const set = new Set(
      assignments
        .filter((a) => a?.className === className)
        .map((a) => a?.section)
        .filter((s) => s !== undefined)
    )
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))
  }, [assignments, className, mode])

  const teacherSubjectSet = useMemo(() => {
    if (mode !== 'teacher') return new Set()
    const set = new Set(
      assignments
        .filter((a) => a?.className === className && String(a?.section || '') === String(section || ''))
        .map((a) => a?.subject?._id)
        .filter(Boolean)
        .map(String)
    )
    return set
  }, [assignments, className, section, mode])

  async function loadBasics() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { classes: cls } = await classesService.listClasses()
      const list = Array.isArray(cls) ? cls : []
      list.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
      setClasses(list)

      if (mode === 'teacher') {
        const { assignments: a } = await examsService.getTeacherAssignments({ year })
        setAssignments(Array.isArray(a) ? a : [])
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function loadExamsForClass() {
    if (!className || !year) {
      setExams([])
      setExamId('')
      return
    }
    try {
      const { exams: ex } = await examsService.listExams({ className, year: Number(year) })
      const list = Array.isArray(ex) ? [...ex] : []
      list.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
      setExams(list)
      if (!list.find((x) => x?._id === examId)) {
        setExamId('')
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load exams')
    }
  }

  function resetGrid() {
    setExam(null)
    setSubjects([])
    setStudents([])
    setMarks({})
    setConstraintsBySubject({})
    setCanEditBySubject({})
    setSuccess('')
  }

  async function loadGrid() {
    if (!examId) return
    if (!className) {
      setError('Please select a class')
      return
    }
    if (!section) {
      setError('Please select a section')
      return
    }

    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const { exam: ex } = await examsService.getExam(examId)
      setExam(ex)

      const subjList = (ex?.subjects || [])
        .map((s) => s?.subject)
        .filter(Boolean)
        .map((s) => ({ _id: s?._id || s, name: s?.name || '' }))
        .filter((s) => s._id)

      const unique = []
      const seen = new Set()
      for (const s of subjList) {
        const id = String(s._id)
        if (seen.has(id)) continue
        seen.add(id)
        unique.push({ _id: id, name: String(s.name || '') })
      }
      unique.sort((a, b) => String(a.name).localeCompare(String(b.name)))
      setSubjects(unique)

      if (!unique.length) {
        resetGrid()
        setExam(ex)
        setSuccess('Exam has no subjects in datesheet yet')
        return
      }

      const sheets = await Promise.all(
        unique.map((s) => examsService.getMarksSheet(examId, { subjectId: s._id, section }))
      )

      const studentsRows = (sheets[0]?.rows || []).map((r) => ({
        _id: r?.student?._id,
        name: `${r?.student?.firstName || ''} ${r?.student?.lastName || ''}`.trim(),
        studentId: r?.student?.studentId || ''
      })).filter((s) => s._id)

      setStudents(studentsRows)

      const nextMarks = {}
      const nextConstraints = {}
      const nextCanEdit = {}

      for (let i = 0; i < unique.length; i++) {
        const subject = unique[i]
        const sheet = sheets[i]
        nextConstraints[subject._id] = sheet?.constraints || {}
        nextCanEdit[subject._id] = !!sheet?.canEdit

        for (const row of sheet?.rows || []) {
          const stId = row?.student?._id
          if (!stId) continue
          const studentKey = String(stId)
          if (!nextMarks[studentKey]) nextMarks[studentKey] = {}
          nextMarks[studentKey][subject._id] = {
            marks: typeof row?.marks?.marks === 'number' ? row.marks.marks : '',
            theoryMarks: typeof row?.marks?.theoryMarks === 'number' ? row.marks.theoryMarks : '',
            practicalMarks: typeof row?.marks?.practicalMarks === 'number' ? row.marks.practicalMarks : ''
          }
        }
      }

      setMarks(nextMarks)
      setConstraintsBySubject(nextConstraints)
      setCanEditBySubject(nextCanEdit)
      setSuccess('Marks grid loaded')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load marks grid')
    } finally {
      setBusy(false)
    }
  }

  function canEditCell(subjectId) {
    const base = !!canEditBySubject[String(subjectId)]
    if (!base) return false
    if (view !== 'edit') return false
    if (mode !== 'teacher') return true
    return teacherSubjectSet.has(String(subjectId))
  }

  function updateMark(studentId, subjectId, field, value) {
    const st = String(studentId)
    const sub = String(subjectId)
    setMarks((prev) => {
      const next = { ...(prev || {}) }
      const row = { ...(next[st] || {}) }
      const cell = { ...(row[sub] || {}) }
      cell[field] = value
      row[sub] = cell
      next[st] = row
      return next
    })
  }

  async function save() {
    if (!examId || !section || !subjects.length) return
    if (view !== 'edit') return

    setError('')
    setSuccess('')
    setBusy(true)

    try {
      for (const subj of subjects) {
        const subjectId = String(subj._id)
        if (!canEditBySubject[subjectId]) continue
        if (mode === 'teacher' && !teacherSubjectSet.has(subjectId)) continue

        const constraints = constraintsBySubject[subjectId] || {}
        const showTheory = typeof constraints?.theoryMax === 'number' && constraints.theoryMax > 0
        const showPractical = typeof constraints?.practicalMax === 'number' && constraints.practicalMax > 0

        const payloadRows = students.map((s) => {
          const cell = marks?.[String(s._id)]?.[subjectId] || {}
          return {
            student: s._id,
            marks: cell.marks === '' ? null : Number(cell.marks),
            ...(showTheory ? { theoryMarks: cell.theoryMarks === '' ? null : Number(cell.theoryMarks) } : {}),
            ...(showPractical ? { practicalMarks: cell.practicalMarks === '' ? null : Number(cell.practicalMarks) } : {})
          }
        })

        // eslint-disable-next-line no-await-in-loop
        await examsService.upsertMarks(examId, { subjectId, section }, { rows: payloadRows })
      }

      setSuccess('Marks saved')
      await loadGrid()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save marks')
    } finally {
      setBusy(false)
    }
  }

  async function submitExam() {
    if (mode !== 'teacher') return
    if (!exam?._id) return
    if (exam?.status !== 'open') {
      setError('Only open exams can be submitted.')
      return
    }
    const ok = window.confirm('Submit this exam? This will lock marks entry for teachers.')
    if (!ok) return
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      await examsService.submitExam(exam._id)
      setSuccess('Submitted')
      await loadGrid()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to submit')
    } finally {
      setBusy(false)
    }
  }

  function exportMatrix({ bookType }) {
    if (!students.length || !subjects.length) return

    const header = ['Student', 'ID']
    const subjectCols = []
    for (const s of subjects) {
      const id = String(s._id)
      const constraints = constraintsBySubject[id] || {}
      const showTheory = typeof constraints?.theoryMax === 'number' && constraints.theoryMax > 0
      const showPractical = typeof constraints?.practicalMax === 'number' && constraints.practicalMax > 0

      if (showTheory || showPractical) {
        if (showTheory) subjectCols.push({ id, label: `${s.name} (T)`, field: 'theoryMarks' })
        if (showPractical) subjectCols.push({ id, label: `${s.name} (P)`, field: 'practicalMarks' })
        subjectCols.push({ id, label: `${s.name} (Total)`, field: 'marks' })
      } else {
        subjectCols.push({ id, label: s.name, field: 'marks' })
      }
    }
    for (const c of subjectCols) header.push(c.label)

    const rows = students.map((st) => {
      const r = [st.name, st.studentId]
      for (const c of subjectCols) {
        const cell = marks?.[String(st._id)]?.[String(c.id)] || {}
        r.push(cell[c.field] ?? '')
      }
      return r
    })

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Marks')

    const fileName = `marks_${className}_${section}_${year}_${String(exam?.type || 'exam')}${exam?.month ? `_m${pad2(exam.month)}` : ''}.${bookType}`
    const out = XLSX.write(wb, { bookType, type: 'array' })
    saveAs(new Blob([out], { type: 'application/octet-stream' }), fileName)
  }

  async function exportPdf() {
    if (!tableRef.current) return
    if (!students.length || !subjects.length) return

    setError('')
    setBusy(true)
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 8
      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width

      let remaining = imgH
      pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH)
      remaining -= pageH - margin * 2

      while (remaining > 0) {
        pdf.addPage()
        const y = margin - (imgH - remaining)
        pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH)
        remaining -= pageH - margin * 2
      }

      const fileName = `marks_${className}_${section}_${year}.pdf`
      pdf.save(fileName)
    } catch {
      setError('Failed to export PDF')
    } finally {
      setBusy(false)
    }
  }

  function printPreview() {
    if (!students.length || !subjects.length) return
    window.print()
  }

  // Loaders
  useEffect(() => {
    loadBasics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mode !== 'teacher') return
    loadBasics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  useEffect(() => {
    setExamId('')
    resetGrid()
    loadExamsForClass()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className, year])

  useEffect(() => {
    resetGrid()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, section])

  const upcomingExams = useMemo(() => {
    const list = Array.isArray(exams) ? [...exams] : []
    list.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
    return list.slice(0, 5)
  }, [exams])

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 no-print">
        <Card>
          <h2 className="font-medium">Selection</h2>
          <div className="mt-3 space-y-2">
            <Select value={year} onChange={(e) => setYear(Number(e.target.value || currentYear))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>

            {mode === 'teacher' ? (
              <Select value={className} onChange={(e) => setClassName(e.target.value)}>
                <option value="">Select class</option>
                {teacherClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            ) : (
              <Select value={className} onChange={(e) => setClassName(e.target.value)}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c?._id} value={c?.name}>{c?.name}</option>
                ))}
              </Select>
            )}

            {mode === 'teacher' ? (
              <Select value={section} onChange={(e) => setSection(e.target.value)} disabled={!className}>
                <option value="">Select section</option>
                {teacherSections.map((s) => (
                  <option key={String(s)} value={String(s)}>{String(s) || '—'}</option>
                ))}
              </Select>
            ) : (
              <Select value={section} onChange={(e) => setSection(e.target.value)} disabled={!className}>
                <option value="">Select section</option>
                {classSections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            )}

            <Select value={examId} onChange={(e) => setExamId(e.target.value)} disabled={!className || !year}>
              <option value="">Select exam</option>
              {exams.map((ex) => (
                <option key={ex?._id} value={ex?._id}>
                  {ex?.name} ({ex?.status}){ex?.month ? ` • ${monthLabel(ex.month)}` : ''}
                </option>
              ))}
            </Select>

            <div className="flex gap-2">
              <Button type="button" onClick={loadGrid} disabled={busy || !examId || !section}>Load</Button>
              <Button type="button" variant="primary" onClick={save} disabled={busy || view !== 'edit'}>Save</Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <h2 className="font-medium">Options</h2>
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={view === 'view' ? 'primary' : 'secondary'} onClick={() => setView('view')}>View</Button>
              <Button type="button" size="sm" variant={view === 'edit' ? 'primary' : 'secondary'} onClick={() => setView('edit')}>Edit</Button>
            </div>
            <div className="text-xs text-gray-600">
              {mode === 'teacher' ? 'Teachers can edit only their assigned subjects (and only if the window is open).' : 'Admin/Principal can edit while allowed by workflow.'}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={printPreview} disabled={!students.length}>Print</Button>
              <Button type="button" onClick={exportPdf} disabled={!students.length}>PDF</Button>
              <Button type="button" onClick={() => exportMatrix({ bookType: 'csv' })} disabled={!students.length}>CSV</Button>
              <Button type="button" onClick={() => exportMatrix({ bookType: 'xlsx' })} disabled={!students.length}>XLSX</Button>
            </div>

            {mode === 'teacher' && exam?._id ? (
              <div>
                <Button type="button" onClick={submitExam} disabled={busy || exam?.status !== 'open'}>Submit</Button>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <h2 className="font-medium">Upcoming Exams</h2>
          <div className="mt-3 space-y-2 text-sm">
            {!className ? (
              <div className="text-gray-600">Select a class to see recent exams.</div>
            ) : !upcomingExams.length ? (
              <div className="text-gray-600">No exams found.</div>
            ) : (
              upcomingExams.map((ex) => (
                <div key={ex?._id} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{ex?.name}</div>
                    <div className="text-xs text-gray-600">{ex?.status}{ex?.month ? ` • ${monthLabel(ex.month)}` : ''}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">Marks Grid</h2>
            {exam ? (
              <p className="text-sm text-gray-600 mt-1">{exam.className} — {exam.name} • Section: {section} • Status: {exam.status}</p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">Select class, section, year and exam to load.</p>
            )}
          </div>
        </div>

        {!students.length || !subjects.length ? (
          <div className="mt-4 text-sm text-gray-600">No grid loaded.</div>
        ) : (
          <div className="mt-4 overflow-auto border rounded" ref={tableRef}>
            <table className="min-w-max w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-gray-600">
                  <th className="py-2 px-3 border-b whitespace-nowrap">Student</th>
                  <th className="py-2 px-3 border-b whitespace-nowrap">ID</th>
                  {subjects.map((s) => (
                    <th key={s._id} className="py-2 px-3 border-b whitespace-nowrap text-center">{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st._id} className="border-t border-gray-200">
                    <td className="py-2 px-3 whitespace-nowrap">{st.name}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{st.studentId}</td>
                    {subjects.map((s) => {
                      const subId = String(s._id)
                      const cell = marks?.[String(st._id)]?.[subId] || {}
                      const constraints = constraintsBySubject[subId] || {}
                      const showTheory = typeof constraints?.theoryMax === 'number' && constraints.theoryMax > 0
                      const showPractical = typeof constraints?.practicalMax === 'number' && constraints.practicalMax > 0
                      const editable = canEditCell(subId)

                      return (
                        <td key={`${st._id}__${subId}`} className="py-2 px-2" style={{ minWidth: 120 }}>
                          {showTheory || showPractical ? (
                            <div className="space-y-1">
                              {showTheory ? (
                                <Input
                                  type="number"
                                  placeholder="T"
                                  value={cell.theoryMarks ?? ''}
                                  disabled={!editable}
                                  onChange={(e) => updateMark(st._id, subId, 'theoryMarks', e.target.value)}
                                />
                              ) : null}
                              {showPractical ? (
                                <Input
                                  type="number"
                                  placeholder="P"
                                  value={cell.practicalMarks ?? ''}
                                  disabled={!editable}
                                  onChange={(e) => updateMark(st._id, subId, 'practicalMarks', e.target.value)}
                                />
                              ) : null}
                              <Input
                                type="number"
                                placeholder="Total"
                                value={cell.marks ?? ''}
                                disabled={!editable}
                                onChange={(e) => updateMark(st._id, subId, 'marks', e.target.value)}
                              />
                            </div>
                          ) : (
                            <Input
                              type="number"
                              value={cell.marks ?? ''}
                              disabled={!editable}
                              onChange={(e) => updateMark(st._id, subId, 'marks', e.target.value)}
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <style jsx global>{`
              @media print {
                .no-print { display: none !important; }
                body { background: white !important; }
                th, td { border: 1px solid #000 !important; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
              }
            `}</style>
          </div>
        )}
      </Card>
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
