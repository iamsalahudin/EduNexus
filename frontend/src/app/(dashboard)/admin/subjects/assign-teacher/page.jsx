'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import teacherService from '@/services/teacher.service'

function dedupe(list) {
  const seen = new Set()
  const out = []
  for (const item of Array.isArray(list) ? list : []) {
    const value = String(item || '').trim()
    const key = value.toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(value)
  }
  return out
}

export default function AssignSubjectToTeacherPage() {
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [className, setClassName] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [selectedTeacher, setSelectedTeacher] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        teacherService.listTeachers({ limit: 500, sortBy: 'name', sortOrder: 'asc' }),
        classesService.listClasses({ active: true }),
        subjectsService.listSubjects({})
      ])
      setTeachers(Array.isArray(tRes?.teachers) ? tRes.teachers : [])
      setClasses(Array.isArray(cRes?.classes) ? cRes.classes : [])
      setSubjects(Array.isArray(sRes?.subjects) ? sRes.subjects : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load assignment data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const subjectsForClass = useMemo(() => {
    if (!className) return []
    return subjects.filter((subject) => String(subject?.className) === String(className)).map((subject) => subject.name)
  }, [subjects, className])

  useEffect(() => {
    setSelectedSubjects(subjectsForClass)
  }, [subjectsForClass])

  async function handleTeacherChange(id) {
    setTeacherId(id)
    setClassName('')
    setSelectedSubjects([])
    setError('')
    setSuccess('')
    if (!id) {
      setSelectedTeacher(null)
      return
    }
    // Optimistic from the list, then load the full record (which includes saved
    // classesAssigned/subjects that the list endpoint does not return).
    setSelectedTeacher(teachers.find((t) => t._id === id) || null)
    try {
      const res = await teacherService.getTeacher(id)
      if (res?.teacher) setSelectedTeacher(res.teacher)
    } catch {
      // keep optimistic value
    }
  }

  async function saveAssignments() {
    setError('')
    setSuccess('')

    if (!teacherId) {
      setError('Select a teacher')
      return
    }
    if (!className) {
      setError('Select a class')
      return
    }
    if (selectedSubjects.length === 0) {
      setError('Select at least one subject')
      return
    }

    const existingClasses = Array.isArray(selectedTeacher?.classesAssigned) ? selectedTeacher.classesAssigned : []
    const existingSubjects = Array.isArray(selectedTeacher?.subjects) ? selectedTeacher.subjects : []

    // Prevent re-assigning the same subject(s) of the same class to the same teacher.
    const classAlready = existingClasses.some((c) => String(c).toLowerCase() === String(className).toLowerCase())
    const existingSubjectKeys = new Set(existingSubjects.map((s) => String(s).toLowerCase()))
    const newSubjects = selectedSubjects.filter((s) => !existingSubjectKeys.has(String(s).toLowerCase()))
    if (classAlready && newSubjects.length === 0) {
      setError('These subjects are already assigned to this teacher for this class.')
      return
    }

    // Merge with existing assignments (additive) and remove duplicates.
    const mergedClasses = dedupe([...existingClasses, className])
    const mergedSubjects = dedupe([...existingSubjects, ...selectedSubjects])

    try {
      const res = await teacherService.updateTeacher(teacherId, {
        classesAssigned: mergedClasses,
        subjects: mergedSubjects
      })
      const saved = res?.teacher
      const updatedTeacher = {
        ...selectedTeacher,
        ...(saved || {}),
        classesAssigned: saved?.classesAssigned ?? mergedClasses,
        subjects: saved?.subjects ?? mergedSubjects
      }
      setSelectedTeacher(updatedTeacher)
      setTeachers((current) => current.map((t) => (t._id === teacherId ? { ...t, ...updatedTeacher } : t)))
      setSuccess('Teacher assignments updated')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update teacher')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Assign Subject to Teacher" subtitle="Update teacher subject and class assignments" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 p-6">
          {loading ? <Skeleton className="h-40" /> : (
            <div className="space-y-4">
              <Select value={teacherId} onChange={(e) => handleTeacherChange(e.target.value)}>
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.user?.name || teacher.user?.email || teacher.employeeId || teacher._id}
                  </option>
                ))}
              </Select>

              <Select value={className} onChange={(e) => setClassName(e.target.value)}>
                <option value="">Select class</option>
                {classes.map((cls) => <option key={cls._id} value={cls.name}>{cls.name}</option>)}
              </Select>

              <div className="grid gap-2 md:grid-cols-2">
                {subjectsForClass.length === 0 ? <div className="text-sm text-gray-600">No subjects available for this class.</div> : subjectsForClass.map((subject) => (
                  <label key={subject} className="flex items-center gap-2 rounded border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject)}
                      onChange={(e) => {
                        setSelectedSubjects((current) => e.target.checked
                          ? [...current, subject]
                          : current.filter((value) => value !== subject))
                      }}
                    />
                    {subject}
                  </label>
                ))}
              </div>

              <Button type="button" onClick={saveAssignments}>Save Assignments</Button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          {selectedTeacher ? (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-900">Current Assignments</h2>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Classes</div>
                {Array.isArray(selectedTeacher?.classesAssigned) && selectedTeacher.classesAssigned.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTeacher.classesAssigned.map((cls) => (
                      <span key={cls} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {cls}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No classes assigned</p>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Subjects</div>
                {Array.isArray(selectedTeacher?.subjects) && selectedTeacher.subjects.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTeacher.subjects.map((subj) => (
                      <span key={subj} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        {subj}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No subjects assigned</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-medium">Info</h2>
              <p className="mt-2 text-sm text-slate-600">Select a teacher to view current assignments and modify them.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
