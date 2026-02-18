"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Skeleton from '@/components/ui/Skeleton'
import { fetchStaffAttendance, markStaffAttendance } from '@/services/attendanceService'

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
  { value: 'leave', label: 'Leave' }
]

export default function MyAttendancePage() {
  const [date, setDate] = useState(toInputDate(new Date()))
  const [status, setStatus] = useState('present')
  const [remarks, setRemarks] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchStaffAttendance({ date })
      const rec = (res.records || [])[0]
      if (rec) {
        setStatus(rec.status || 'present')
        setRemarks(rec.remarks || '')
      } else {
        setStatus('present')
        setRemarks('')
      }
      setLoaded(true)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  async function onSave() {
    setLoading(true)
    setError(null)
    try {
      await markStaffAttendance({ date, status, remarks })
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
          <h1 className="text-2xl font-semibold">My Attendance</h1>
          <p className="text-sm text-gray-600 mt-1">Mark your own attendance (staff/teacher attendance).</p>
        </div>
        <Link href="/teacher/attendance" className="px-3 py-2 border rounded hover-theme-primary">Back</Link>
      </div>

      <div className="mt-6 card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Date</label>
            <input className="input mt-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            {!loaded && loading ? (
              <div className="mt-2"><Skeleton className="h-10" /></div>
            ) : (
              <select className="input mt-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Remarks (optional)</label>
            <input className="input mt-2" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="btn-primary" onClick={onSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <button className="px-3 py-2 border rounded hover-theme-primary" onClick={load} disabled={loading}>Refresh</button>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </div>
    </div>
  )
}
