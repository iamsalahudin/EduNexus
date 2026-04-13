'use client'

import { useEffect, useMemo, useState } from 'react'
import StudentSearchPicker from '@/components/students/StudentSearchPicker'
import { Button, Card, PageHeader, Select } from '@/components/ui'
import classesService from '@/services/classesService'
import studentsService from '@/services/studentsService'

export default function StudentPromotionPage() {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [classes, setClasses] = useState([])
  const [newClass, setNewClass] = useState('')
  const [newSection, setNewSection] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    async function loadClasses() {
      try {
        const { classes: rows } = await classesService.listClasses({ active: true })
        if (active) setClasses(Array.isArray(rows) ? rows : [])
      } catch {
        if (active) setClasses([])
      }
    }
    loadClasses()
    return () => {
      active = false
    }
  }, [])

  const sections = useMemo(() => {
    const found = classes.find((c) => String(c?.name) === String(newClass))
    return Array.isArray(found?.sections) ? found.sections : []
  }, [classes, newClass])

  async function promoteStudent() {
    if (!selectedStudent?._id) {
      setError('Please select a student first')
      setSuccess('')
      return
    }
    if (!newClass) {
      setError('Please select a new class')
      setSuccess('')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        class: newClass,
        section: newSection || undefined,
        status: 'incampus',
      }
      await studentsService.updateStudent(selectedStudent._id, payload)
      setSuccess('Student promoted successfully')
      setSelectedStudent((prev) => (prev ? { ...prev, class: newClass, section: newSection || '' } : prev))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to promote student')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Promotion"
        subtitle="Search a student, verify current class-section, and move to a new class-section."
      />

      <Card>
        <h2 className="font-medium">Select Student</h2>
        <p className="text-sm text-gray-600 mt-1">Pick the student you want to promote.</p>
        <div className="mt-4">
          <StudentSearchPicker selectedStudent={selectedStudent} onSelect={setSelectedStudent} />
        </div>
      </Card>

      <Card>
        <h2 className="font-medium">Promotion Details</h2>

        {selectedStudent ? (
          <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm break-words">
            Current Class-Section: <span className="font-medium">{[selectedStudent.class, selectedStudent.section].filter(Boolean).join(' - ') || '-'}</span>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={newClass} onChange={(e) => setNewClass(e.target.value)}>
            <option value="">Select new class</option>
            {classes.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </Select>

          <Select
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            disabled={!newClass || sections.length === 0}
          >
            <option value="">
              {!newClass ? 'Select class first' : sections.length === 0 ? 'No sections' : 'Select new section (optional)'}
            </option>
            {sections.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </Select>
        </div>

        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
        {success ? <div className="mt-3 text-sm text-green-600">{success}</div> : null}

        <div className="mt-4">
          <Button type="button" variant="primary" className="w-full sm:w-auto" onClick={promoteStudent} disabled={submitting}>
            {submitting ? 'Promoting...' : 'Promote Student'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
