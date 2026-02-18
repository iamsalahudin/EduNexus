"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Skeleton from '@/components/ui/Skeleton'
import { fetchStudents, fetchStudentAttendance, markStudentAttendance } from '@/services/attendanceService'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' }
]

export default function AdminStudentAttendancePage() {
  const [date, setDate] = useState(toInputDate(new Date()))
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])

  async function load() {
    if (!classId) {
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        fetchStudents({ classId, section: section || undefined, limit: 500 }),
        fetchStudentAttendance({ classId, date })
      ])
      const students = studentsRes.students || []
      const records = attendanceRes.records || []

      const recordByStudentId = new Map()
      for (const r of records) {
        const sid = r?.student?._id || r?.student
        if (sid) recordByStudentId.set(String(sid), r)
      }

      setRows(
        students.map((s) => {
          const existing = recordByStudentId.get(String(s._id))
          return {
            student: s,
            status: existing?.status || 'present'
          }
        })
      )
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, section, date])

  function setStatus(studentId, status) {
    setRows((prev) => prev.map((r) => (String(r.student._id) === String(studentId) ? { ...r, status } : r)))
  }

  async function onSave() {
    setLoading(true)
    setError(null)
    try {
      const entries = rows.map((r) => ({ studentId: r.student._id, status: r.status }))
      await markStudentAttendance({ date, entries })
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Student Attendance</h1>
          <p className="text-sm text-gray-600 mt-1">Admin marking and overview by class.</p>
        </div>
        <Link href="/admin/attendance" className="px-3 py-2 border rounded hover-theme-primary">Back</Link>
      </div>

      <div className="mt-6 card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Date</label>
            <input className="input mt-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Class</label>
            <input className="input mt-2" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g. 10" />
          </div>
          <div>
            <label className="text-sm font-medium">Section (optional)</label>
            <input className="input mt-2" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="btn-primary" onClick={onSave} disabled={loading || rows.length === 0}>
            {loading ? 'Saving...' : 'Save Attendance'}
          </button>
          <button className="px-3 py-2 border rounded hover-theme-primary" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </div>

      <div className="mt-6 card">
        <h3 className="font-medium">Roster</h3>
        <div className="mt-3 overflow-auto">
          {loading && rows.length === 0 ? (
            <Skeleton className="h-40" />
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">Select a class to load students.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.student._id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3">{r.student.firstName} {r.student.lastName}</td>
                    <td className="py-2 pr-3">{r.student.studentId}</td>
                    <td className="py-2 pr-3">
                      <select className="input" value={r.status} onChange={(e) => setStatus(r.student._id, e.target.value)}>
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
