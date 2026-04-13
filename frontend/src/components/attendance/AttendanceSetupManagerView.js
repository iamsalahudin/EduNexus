'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import { api } from '@/services/api'
import {
  deleteAttendanceAssignment,
  fetchAttendanceAssignments,
  saveAttendanceAssignment,
} from '@/services/attendanceService'

function trimText(value) {
  return String(value || '').trim()
}

function pairKey(className, section) {
  return `${trimText(className).toLowerCase()}::${trimText(section).toLowerCase()}`
}

function normalizeSection(section) {
  return trimText(section)
}

export default function AttendanceSetupManagerView({
  roleBase = '/admin',
  backHref = '/admin/attendance',
  title = 'Attendance Setup',
  subtitle = 'Assign teachers to class and section pairs for attendance control.',
}) {
  const [loading, setLoading] = useState(false)
  const [teachersLoading, setTeachersLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])

  const [editingId, setEditingId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const [userRes, classRes, assignmentRes] = await Promise.all([
        api.get('/users', { params: { limit: 1200 } }),
        classesService.listClasses({ active: true }),
        fetchAttendanceAssignments(),
      ])

      const users = Array.isArray(userRes?.data?.users) ? userRes.data.users : []
      setTeachers(
        users
          .filter((user) => String(user?.role || '').toLowerCase() === 'teacher')
          .map((user) => ({
            id: String(user?._id || ''),
            name: String(user?.name || user?.username || 'Teacher').trim(),
            email: String(user?.email || '').trim(),
          }))
          .filter((user) => user.id)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      setClasses(Array.isArray(classRes?.classes) ? classRes.classes : [])
      setAssignments(Array.isArray(assignmentRes?.assignments) ? assignmentRes.assignments : [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load attendance setup data')
      setTeachers([])
      setClasses([])
      setAssignments([])
    } finally {
      setLoading(false)
      setTeachersLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const editingAssignment = useMemo(() => {
    return assignments.find((assignment) => String(assignment?._id || '') === String(editingId || '')) || null
  }, [assignments, editingId])

  const allPairs = useMemo(() => {
    const pairs = []
    classes.forEach((schoolClass) => {
      const clsName = trimText(schoolClass?.name)
      if (!clsName) return

      const sections = Array.isArray(schoolClass?.sections) && schoolClass.sections.length > 0
        ? schoolClass.sections
        : ['']

      sections.forEach((rawSection) => {
        pairs.push({
          className: clsName,
          section: normalizeSection(rawSection),
        })
      })
    })
    return pairs
  }, [classes])

  const availablePairs = useMemo(() => {
    const blocked = new Set(
      assignments
        .filter((assignment) => String(assignment?._id || '') !== String(editingId || ''))
        .map((assignment) => pairKey(assignment?.className, assignment?.section))
    )

    return allPairs.filter((pair) => !blocked.has(pairKey(pair.className, pair.section)))
  }, [allPairs, assignments, editingId])

  const classOptions = useMemo(() => {
    const map = new Map()
    availablePairs.forEach((pair) => {
      if (!map.has(pair.className)) {
        map.set(pair.className, [])
      }
      map.get(pair.className).push(pair.section)
    })
    if (editingAssignment?.className) {
      if (!map.has(editingAssignment.className)) {
        map.set(editingAssignment.className, [])
      }
      const sections = map.get(editingAssignment.className)
      const editSection = normalizeSection(editingAssignment.section)
      if (editSection && !sections.includes(editSection)) sections.push(editSection)
      if (!editSection && !sections.includes('')) sections.push('')
    }
    return Array.from(map.entries())
      .map(([name, sections]) => ({ name, sections: [...new Set(sections)] }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [availablePairs, editingAssignment])

  const selectedClass = useMemo(() => {
    return classes.find((schoolClass) => String(schoolClass?.name || '') === String(className || '')) || null
  }, [classes, className])

  const sectionOptions = useMemo(() => {
    if (!selectedClass) return []
    const sections = Array.isArray(selectedClass.sections) && selectedClass.sections.length > 0 ? selectedClass.sections : ['']
    const allowed = new Set(
      availablePairs
        .filter((pair) => pair.className === selectedClass.name)
        .map((pair) => pair.section)
    )
    const editSection = editingAssignment && editingAssignment.className === selectedClass.name
      ? normalizeSection(editingAssignment.section)
      : ''

    return sections
      .map((rawSection) => normalizeSection(rawSection))
      .filter((sectionValue) => allowed.has(sectionValue) || sectionValue === editSection)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b))
  }, [selectedClass, availablePairs, editingAssignment])

  useEffect(() => {
    if (!editingAssignment) return
    setTeacherId(String(editingAssignment?.teacher?._id || ''))
    setClassName(String(editingAssignment?.className || ''))
    setSection(normalizeSection(editingAssignment?.section))
  }, [editingAssignment])

  useEffect(() => {
    if (!classOptions.length) {
      if (className) setClassName('')
      if (section) setSection('')
      return
    }

    const currentClassAllowed = classOptions.some((option) => option.name === className)
    if (!currentClassAllowed && className) {
      setClassName('')
      setSection('')
      return
    }

    if (className && sectionOptions.length > 0 && !sectionOptions.includes(section)) {
      setSection('')
    }
  }, [classOptions, className, section, sectionOptions])

  const assignmentRows = useMemo(() => {
    return assignments
      .slice()
      .sort((a, b) => {
        const classDelta = String(a?.className || '').localeCompare(String(b?.className || ''))
        if (classDelta !== 0) return classDelta
        const sectionDelta = String(a?.section || '').localeCompare(String(b?.section || ''))
        if (sectionDelta !== 0) return sectionDelta
        return String(a?.teacher?.name || '').localeCompare(String(b?.teacher?.name || ''))
      })
  }, [assignments])

  async function handleSave() {
    if (!teacherId || !className) {
      setError('Please choose a teacher and a class.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await saveAttendanceAssignment({
        id: editingId || undefined,
        teacherId,
        className,
        section,
      })
      setSuccess('Attendance assignment saved.')
      setEditingId('')
      setTeacherId('')
      setClassName('')
      setSection('')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save assignment')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(assignmentId) {
    if (!window.confirm('Remove this attendance assignment?')) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await deleteAttendanceAssignment(assignmentId)
      if (String(editingId || '') === String(assignmentId || '')) {
        setEditingId('')
        setTeacherId('')
        setClassName('')
        setSection('')
      }
      setSuccess('Attendance assignment removed.')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to remove assignment')
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(assignment) {
    setEditingId(String(assignment?._id || ''))
    setTeacherId(String(assignment?.teacher?._id || ''))
    setClassName(String(assignment?.className || ''))
    setSection(normalizeSection(assignment?.section))
  }

  const teacherOptions = useMemo(() => teachers.map((teacher) => ({
    value: teacher.id,
    label: `${teacher.name}${teacher.email ? ` — ${teacher.email}` : ''}`,
  })), [teachers])

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={<ButtonLink href={backHref} variant="secondary">Back</ButtonLink>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-700">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Available Pairs</div>
          <div className="text-2xl font-semibold mt-1">{availablePairs.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Assignments</div>
          <div className="text-2xl font-semibold mt-1">{assignments.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Teachers Loaded</div>
          <div className="text-2xl font-semibold mt-1">{teachers.length}</div>
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="font-semibold">Assign Teacher to Class / Section</h3>
        <p className="text-sm text-gray-600 mt-1">Choose only from available class-section pairs. One teacher may be assigned to multiple pairs.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Select teacher</option>
            {teacherOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>

          <Select label="Class" value={className} onChange={(e) => setClassName(e.target.value)}>
            <option value="">Select class</option>
            {classOptions.map((option) => (
              <option key={option.name} value={option.name}>{option.name}</option>
            ))}
          </Select>

          <Select label="Section" value={section} onChange={(e) => setSection(e.target.value)} disabled={!className || sectionOptions.length === 0}>
            <option value="">{!className ? 'Select class first' : sectionOptions.length === 0 ? 'No available sections' : 'Select section'}</option>
            {sectionOptions.map((sectionOption) => (
              <option key={sectionOption || 'blank'} value={sectionOption}>{sectionOption || 'No section'}</option>
            ))}
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={loading || teachersLoading || !teacherId || !className}>
            {editingId ? 'Update Assignment' : 'Add Assignment'}
          </Button>
          {editingId ? (
            <Button
              variant="outline"
              onClick={() => {
                setEditingId('')
                setTeacherId('')
                setClassName('')
                setSection('')
              }}
              disabled={loading}
            >
              Cancel Edit
            </Button>
          ) : null}
          <Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>
        </div>
      </Card>

      <Card className="mt-6 overflow-auto">
        <h3 className="font-semibold mb-4">Current Assignments</h3>
        {loading && assignments.length === 0 ? (
          <Skeleton className="h-40" />
        ) : assignmentRows.length === 0 ? (
          <div className="text-sm text-gray-600">No assignments added yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="py-3 px-4 font-semibold">Class</th>
                <th className="py-3 px-4 font-semibold">Section</th>
                <th className="py-3 px-4 font-semibold">Teacher</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignmentRows.map((assignment) => (
                <tr key={assignment._id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 px-4">{assignment?.className || '-'}</td>
                  <td className="py-3 px-4">{assignment?.section || '—'}</td>
                  <td className="py-3 px-4">{assignment?.teacher?.name || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)} disabled={loading}>Update</Button>
                      <Button variant="outline" size="sm" onClick={() => handleRemove(assignment._id)} disabled={loading} className="text-red-600">Remove</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}