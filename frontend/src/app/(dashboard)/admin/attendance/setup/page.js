"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Skeleton from '@/components/ui/Skeleton'
import { api } from '@/services/api'
import { fetchStudents } from '@/services/attendanceService'
import classesService from '@/services/classesService'

export default function AttendanceSetupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [teachers, setTeachers] = useState([])
  const [studentUsers, setStudentUsers] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])

  // Teacher assignment
  const [teacherId, setTeacherId] = useState('')
  const [teacherClass, setTeacherClass] = useState('')
  const [teacherSection, setTeacherSection] = useState('')

  const teacherSections = (() => {
    const c = classes.find((x) => String(x?.name) === String(teacherClass))
    return Array.isArray(c?.sections) ? c.sections : []
  })()

  // Student linking
  const [studentUserId, setStudentUserId] = useState('')
  const [studentRefId, setStudentRefId] = useState('')

  const selectedTeacher = useMemo(
    () => teachers.find((t) => String(t._id) === String(teacherId)) || null,
    [teachers, teacherId]
  )
  const selectedStudentUser = useMemo(
    () => studentUsers.find((u) => String(u._id) === String(studentUserId)) || null,
    [studentUsers, studentUserId]
  )

  async function load() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [tRes, sRes, stuRes, cRes] = await Promise.all([
        api.get('/users', { params: { role: 'Teacher', limit: 500 } }),
        api.get('/users', { params: { role: 'Student', limit: 500 } }),
        fetchStudents({ limit: 500 }),
        classesService.listClasses({ active: true })
      ])
      setTeachers(tRes.data.users || [])
      setStudentUsers(sRes.data.users || [])
      setStudents(stuRes.students || [])
      setClasses(Array.isArray(cRes?.classes) ? cRes.classes : [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load setup data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Keep inputs synced when selecting a teacher
  useEffect(() => {
    if (!selectedTeacher) return
    const cls = selectedTeacher?.profile?.class || selectedTeacher?.profile?.classId || ''
    const sec = selectedTeacher?.profile?.section || ''
    setTeacherClass(cls ? String(cls) : '')
    setTeacherSection(sec ? String(sec) : '')
  }, [selectedTeacher])

  useEffect(() => {
    if (!teacherClass) {
      if (teacherSection) setTeacherSection('')
      return
    }
    if (teacherSections.length > 0 && teacherSection && !teacherSections.includes(teacherSection)) {
      setTeacherSection('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherClass, classes])

  useEffect(() => {
    if (!selectedStudentUser) return
    const ref = selectedStudentUser?.profile?.studentRef || ''
    setStudentRefId(ref ? String(ref) : '')
  }, [selectedStudentUser])

  async function saveTeacher() {
    if (!teacherId) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.patch(`/users/${teacherId}`, {
        profile: {
          class: teacherClass,
          section: teacherSection
        }
      })
      setSuccess('Teacher class/section saved')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save teacher settings')
    } finally {
      setLoading(false)
    }
  }

  async function saveStudentLink() {
    if (!studentUserId) return
    if (!studentRefId) {
      setError('Select a Student record to link')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.patch(`/users/${studentUserId}`, {
        profile: {
          studentRef: studentRefId
        }
      })
      setSuccess('Student user linked to Student record')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to link student user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendance Setup</h1>
          <p className="text-sm text-gray-600 mt-1">Configure scoping links so attendance works correctly.</p>
        </div>
        <Link href="/admin/attendance" className="px-3 py-2 border rounded hover-theme-primary">Back</Link>
      </div>

      {loading && teachers.length === 0 ? (
        <div className="mt-6"><Skeleton className="h-28" /></div>
      ) : null}

      {error ? <div className="mt-6 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-6 text-sm text-green-700">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-medium">Teacher → Class/Section</h3>
          <p className="text-sm text-gray-600 mt-1">This enforces “teacher can mark only their class”.</p>

          <div className="mt-4">
            <label className="text-sm font-medium">Teacher</label>
            <select className="input mt-2" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">Select</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name} — {t.email}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Class</label>
              <select className="input mt-2" value={teacherClass} onChange={(e) => setTeacherClass(e.target.value)}>
                <option value="">(None)</option>
                {/* keep current value visible even if it doesn't exist anymore */}
                {teacherClass && !classes.some((c) => c.name === teacherClass) ? (
                  <option value={teacherClass}>{teacherClass} (custom)</option>
                ) : null}
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Section (optional)</label>
              <select
                className="input mt-2"
                value={teacherSection}
                onChange={(e) => setTeacherSection(e.target.value)}
                disabled={!teacherClass || teacherSections.length === 0}
              >
                <option value="">
                  {!teacherClass ? 'Select class first' : teacherSections.length === 0 ? 'No sections' : '(None)'}
                </option>
                {teacherSection && teacherSections.length > 0 && !teacherSections.includes(teacherSection) ? (
                  <option value={teacherSection}>{teacherSection} (custom)</option>
                ) : null}
                {teacherSections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button className="btn-primary" onClick={saveTeacher} disabled={loading || !teacherId}>Save</button>
          </div>
        </div>

        <div className="card">
          <h3 className="font-medium">Student User → Student Record</h3>
          <p className="text-sm text-gray-600 mt-1">This makes the Student dashboard show only their own attendance.</p>

          <div className="mt-4">
            <label className="text-sm font-medium">Student Login (User)</label>
            <select className="input mt-2" value={studentUserId} onChange={(e) => setStudentUserId(e.target.value)}>
              <option value="">Select</option>
              {studentUsers.map((u) => (
                <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">Student Record</label>
            <select className="input mt-2" value={studentRefId} onChange={(e) => setStudentRefId(e.target.value)}>
              <option value="">Select</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.studentId} — {s.firstName} {s.lastName} ({s.class}{s.section ? `-${s.section}` : ''})</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-2">Saved into the user profile as: <span className="font-mono">profile.studentRef</span></div>
          </div>

          <div className="mt-4">
            <button className="btn-primary" onClick={saveStudentLink} disabled={loading || !studentUserId}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
