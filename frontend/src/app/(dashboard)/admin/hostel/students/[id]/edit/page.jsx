'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'
import hostelService from '@/services/hostelService'

function getResidentName(resident) {
  return resident?.student?.user?.name || resident?.student?.name || resident?.student?.studentId || 'Student'
}

function getStatusClass(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'active') return 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200'
  if (value === 'left' || value === 'inactive') return 'inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200'
  return 'inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200'
}

export default function HostelStudentEditPage({ params }) {
  const router = useRouter()
  const [resident, setResident] = useState(null)
  const [hostels, setHostels] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({ hostelId: '', roomId: '', joinDate: '', leaveDate: '', status: 'active', notes: '' })

  useEffect(() => {
    let mounted = true

    async function loadResident() {
      try {
        setLoading(true)
        setError('')
        const [detailRes, hostelsRes, roomsRes] = await Promise.all([
          hostelService.getResidentById(params?.id),
          hostelService.listHostels({ active: true }),
          hostelService.listRooms({ active: true })
        ])

        if (!mounted) return
        setResident(detailRes?.resident || null)
        setHostels(Array.isArray(hostelsRes?.hostels) ? hostelsRes.hostels : [])
        setRooms(Array.isArray(roomsRes?.rooms) ? roomsRes.rooms : [])

        const row = detailRes?.resident
        setFormData({
          hostelId: row?.hostel?._id || row?.hostel || '',
          roomId: row?.room?._id || row?.room || '',
          joinDate: row?.joinDate ? new Date(row.joinDate).toISOString().slice(0, 10) : '',
          leaveDate: row?.leaveDate ? new Date(row.leaveDate).toISOString().slice(0, 10) : '',
          status: row?.status || 'active',
          notes: row?.notes || ''
        })
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || 'Failed to load resident')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadResident()
    return () => {
      mounted = false
    }
  }, [params?.id])

  async function saveChanges(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await hostelService.updateResident(params?.id, formData)
      setSuccess('Allocation updated')
      router.push(`/admin/hostel/students/${params?.id}`)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update allocation')
    } finally {
      setSaving(false)
    }
  }

  async function removeAllocation() {
    if (!window.confirm('Remove this hostel allocation?')) return
    try {
      await hostelService.deleteResident(params?.id)
      router.push('/admin/hostel/students')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove allocation')
    }
  }

  const filteredRooms = rooms.filter((room) => !formData.hostelId || String(room.hostel?._id || room.hostel) === String(formData.hostelId))

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Hostel Student" subtitle="Update the resident allocation, room, and notes." />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card className="max-w-3xl p-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : resident ? (
          <form onSubmit={saveChanges} className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Resident</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{getResidentName(resident)}</div>
                  <div className="text-sm text-slate-600">{resident.student?.studentId || 'Student ID unavailable'}</div>
                </div>
                <span className={getStatusClass(formData.status)}>{formData.status || 'active'}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-700">
                <div>
                  <div className="text-xs uppercase text-slate-500">Current hostel</div>
                  <div className="mt-1 font-medium">{resident.hostel?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Current room</div>
                  <div className="mt-1 font-medium">{resident.room?.roomNumber || '-'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Current join date</div>
                  <div className="mt-1 font-medium">{resident.joinDate ? new Date(resident.joinDate).toLocaleDateString() : '-'}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select value={formData.hostelId} onChange={(e) => setFormData((current) => ({ ...current, hostelId: e.target.value, roomId: '' }))} required>
                <option value="">Select hostel</option>
                {hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.name}</option>)}
              </Select>
              <Select value={formData.roomId} onChange={(e) => setFormData((current) => ({ ...current, roomId: e.target.value }))} required>
                <option value="">Select room</option>
                {filteredRooms.map((room) => <option key={room._id} value={room._id}>{room.hostel?.name || 'Hostel'} - Room {room.roomNumber}</option>)}
              </Select>
              <Input type="date" value={formData.joinDate} onChange={(e) => setFormData((current) => ({ ...current, joinDate: e.target.value }))} />
              <Input type="date" value={formData.leaveDate} onChange={(e) => setFormData((current) => ({ ...current, leaveDate: e.target.value }))} />
              <Select value={formData.status} onChange={(e) => setFormData((current) => ({ ...current, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="left">Left</option>
              </Select>
            </div>

            <Textarea rows={4} value={formData.notes} onChange={(e) => setFormData((current) => ({ ...current, notes: e.target.value }))} placeholder="Notes" />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
              <Button type="button" variant="outline" onClick={removeAllocation}>Remove allocation</Button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-600">Resident not found.</div>
        )}
      </Card>
    </div>
  )
}