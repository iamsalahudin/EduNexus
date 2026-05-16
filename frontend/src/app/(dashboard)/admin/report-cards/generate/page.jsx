'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import studentsService from '@/services/studentsService'
import subjectsService from '@/services/subjectsService'
import reportCardsService from '@/services/reportCardsService'

export default function GenerateReportCardsPage() {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cls, setCls] = useState('')
  const [term, setTerm] = useState('Term 1')
  const [year, setYear] = useState(new Date().getFullYear())
  const [marks, setMarks] = useState({})

  const exportRows = students.map((student) => {
    const row = {
      studentId: student.studentId,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      term,
      year
    }
    subjects.forEach((subject) => {
      row[subject.name] = marks[`${student._id}-${subject._id}`] || 0
    })
    row.total = subjects.reduce((sum, subject) => sum + (marks[`${student._id}-${subject._id}`] || 0), 0)
    row.percentage = subjects.length ? Math.round((row.total / (subjects.length * 100)) * 10000) / 100 : 0
    return row
  })

  async function loadClasses() {
    try {
      const res = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(res?.classes) ? res.classes : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load classes')
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  async function loadStudents(className) {
    if (!className) return
    setLoading(true)
    setError('')
    try {
      const res = await studentsService.listStudents({ class: className, active: true })
      const list = Array.isArray(res?.students) ? res.students : []
      setStudents(list)
      const subRes = await subjectsService.listSubjects({ className })
      const subs = Array.isArray(subRes?.subjects) ? subRes.subjects : []
      setSubjects(subs)
      setMarks({})
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const handleMarksChange = (studentId, subjectId, value) => {
    setMarks((prev) => ({
      ...prev,
      [`${studentId}-${subjectId}`]: Math.max(0, Math.min(100, Number(value) || 0))
    }))
  }

  async function saveReportCard(studentId) {
    setError('')
    setSuccess('')
    try {
      const subjectMarks = subjects.map((s) => ({
        subject: s._id,
        marks: marks[`${studentId}-${s._id}`] || 0,
        remarks: ''
      }))
      await reportCardsService.createOrUpdate({ studentId, term, year, subjects: subjectMarks })
      setSuccess('Report card saved')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save')
    }
  }

  function downloadCsv() {
    const headers = ['studentId', 'name', 'term', 'year', ...subjects.map((s) => s.name), 'total', 'percentage']
    const lines = [headers.join(',')]
    exportRows.forEach((row) => {
      lines.push(headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-cards-${cls}-${term}-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadXlsx() {
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(exportRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'ReportCards')
      const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
      const blob = new Blob([out], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-cards-${cls}-${term}-${year}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export XLSX')
    }
  }

  async function downloadPdf() {
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
      const doc = new jsPDF('portrait', 'pt', 'a4')
      doc.setFontSize(14)
      doc.text(`Report Cards - ${cls} - ${term} - ${year}`, 40, 40)
      let y = 70
      exportRows.forEach((row, index) => {
        if (y > 730) {
          doc.addPage()
          y = 40
        }
        doc.setFontSize(11)
        doc.text(`${index + 1}. ${row.name} (${row.studentId})`, 40, y)
        y += 16
        subjects.forEach((subject) => {
          const mark = marks[`${students[index]._id}-${subject._id}`] || 0
          doc.setFontSize(9)
          doc.text(`${subject.name}: ${mark}`, 52, y)
          y += 12
        })
        doc.text(`Total: ${row.total}   Percentage: ${row.percentage}%`, 52, y)
        y += 18
      })
      doc.save(`report-cards-${cls}-${term}-${year}.pdf`)
    } catch (err) {
      setError('Failed to export PDF')
    }
  }

  async function downloadServerPdf() {
    setError('')
    try {
      const params = { term, year }
      const studentIds = students.map((s) => s._id).join(',')
      if (studentIds) params.studentIds = studentIds
      const blob = await reportCardsService.exportPdf(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-cards-${cls}-${term}-${year}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to download server PDF')
    }
  }

  async function downloadServerZip() {
    setError('')
    try {
      const params = { term, year }
      const studentIds = students.map((s) => s._id).join(',')
      if (studentIds) params.studentIds = studentIds
      const blob = await reportCardsService.exportZip(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-cards-${cls}-${term}-${year}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to download ZIP')
    }
  }

  const selectedClass = classes.find((c) => String(c?.name) === String(cls))

  return (
    <div className="space-y-6">
      <PageHeader title="Generate Report Cards" subtitle="Create and manage student report cards" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Select value={cls} onChange={(e) => { setCls(e.target.value); loadStudents(e.target.value); }}>
          <option value="">Select class</option>
          {classes.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
        </Select>
        <Select value={term} onChange={(e) => setTerm(e.target.value)}>
          <option>Term 1</option>
          <option>Term 2</option>
          <option>Term 3</option>
          <option>Final</option>
        </Select>
        <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <Button onClick={() => cls && loadStudents(cls)} disabled={!cls}>Reload</Button>
      </div>

      {cls && students.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadCsv}>Export CSV</Button>
          <Button variant="outline" onClick={downloadXlsx}>Export XLSX</Button>
          <Button variant="outline" onClick={downloadPdf}>Generate PDF</Button>
          <Button variant="outline" onClick={downloadServerPdf}>Export PDF (Server)</Button>
          <Button variant="outline" onClick={downloadServerZip}>Export ZIP (Server)</Button>
        </div>
      ) : null}

      {!cls ? (
        <Card><div className="text-sm text-gray-600">Select a class to begin.</div></Card>
      ) : loading ? (
        <Skeleton className="h-40" />
      ) : students.length === 0 ? (
        <Card><div className="text-sm text-gray-600">No students in this class.</div></Card>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <Card key={student._id}>
              <div className="flex items-center justify-between mb-3">
                <div><div className="font-semibold">{student.firstName} {student.lastName}</div><div className="text-xs text-gray-600">{student.studentId}</div></div>
                <Button size="sm" onClick={() => saveReportCard(student._id)}>Save Card</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                {subjects.map((s) => (
                  <div key={s._id}>
                    <label className="text-xs text-gray-600">{s.name}</label>
                    <Input type="number" min="0" max="100" value={marks[`${student._id}-${s._id}`] || 0} onChange={(e) => handleMarksChange(student._id, s._id, e.target.value)} className="mt-1" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
