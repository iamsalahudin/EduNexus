"use client"

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
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
      <PageHeader
        title="My Attendance"
        subtitle="Mark your own attendance (staff/teacher attendance)."
        right={<ButtonLink href="/teacher/attendance">Back</ButtonLink>}
      />

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} inputClassName="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            {!loaded && loading ? (
              <div className="mt-2"><Skeleton className="h-10" /></div>
            ) : (
              <Select className="mt-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Remarks (optional)</label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" inputClassName="mt-2" />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Button variant="primary" onClick={onSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </Card>
    </div>
  )
}

