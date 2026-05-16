'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import hostelService from '@/services/hostelService'
import studentsService from '@/services/studentsService'

export default function StudentAllocationPage() {
  const [allocations, setAllocations] = useState([])
  const [hostels, setHostels] = useState([])
  const [students, setStudents] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({ studentId: '', hostelId: '', roomId: '', joinDate: '', notes: '' })

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [allocationsData, studentsData, roomsData] = await Promise.all([
        hostelService.listResidents(),
        studentsService.listStudents({ active: true }),
        hostelService.listRooms()
      ])
      const hostelsData = await hostelService.listHostels({ active: true })
      setAllocations(Array.isArray(allocationsData?.residents) ? allocationsData.residents : [])
      setHostels(Array.isArray(hostelsData?.hostels) ? hostelsData.hostels : [])
      setStudents(Array.isArray(studentsData?.students) ? studentsData.students : [])
      setRooms(Array.isArray(roomsData?.rooms) ? roomsData.rooms : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleAllocate(e) {
    e.preventDefault()
    setError('')
    try {
      await hostelService.createResident(formData)
      setSuccess('Student allocated')
      setFormData({ studentId: '', hostelId: '', roomId: '', joinDate: '', notes: '' })
      loadData()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to allocate')
    }
  }

  async function handleDeallocate(id) {
    if (!window.confirm('Remove this allocation?')) return
    try {
      await hostelService.deleteResident(id)
      setSuccess('Allocation removed')
      loadData()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to deallocate')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Student Allocation" subtitle="Assign students to hostel rooms" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 p-6">
          <form onSubmit={handleAllocate} className="space-y-4">
            <Select value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((student) => <option key={student._id} value={student._id}>{student.user?.name || student.name || student.studentId}</option>)}
            </Select>
            <Select value={formData.hostelId} onChange={(e) => setFormData({ ...formData, hostelId: e.target.value })} required>
              <option value="">Select hostel</option>
              {hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.name}</option>)}
            </Select>
            <Select value={formData.roomId} onChange={(e) => setFormData({ ...formData, roomId: e.target.value })} required>
              <option value="">Select room</option>
              {rooms
                .filter((room) => !formData.hostelId || String(room.hostel?._id || room.hostel) === String(formData.hostelId))
                .map((room) => <option key={room._id} value={room._id}>{room.hostel?.name || 'Hostel'} - Room {room.roomNumber}</option>)}
            </Select>
            <Input type="date" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} />
            <Input placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            <Button type="submit" className="w-full">Allocate Student</Button>
          </form>
        </Card>

        <Card className="md:col-span-2 overflow-hidden">
          {loading ? <Skeleton className="h-40" /> : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b"><tr><th className="px-6 py-4 font-semibold">Student</th><th className="px-6 py-4 font-semibold">Hostel/Room</th><th className="px-6 py-4 font-semibold">Joined</th><th className="px-6 py-4 font-semibold text-right">Actions</th></tr></thead>
              <tbody className="divide-y">
                {allocations.length === 0 ? <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No allocations</td></tr> : allocations.map((alloc) => (<tr key={alloc._id}><td className="px-6 py-4"><div className="font-medium">{alloc.student?.user?.name || alloc.student?.name || alloc.student?.studentId}</div><div className="text-xs text-gray-500">{alloc.student?.studentId}</div></td><td className="px-6 py-4"><div>{alloc.hostel?.name || '-'}</div><div className="text-xs text-gray-400">Room {alloc.room?.roomNumber || '-'}</div></td><td className="px-6 py-4">{alloc.joinDate ? new Date(alloc.joinDate).toLocaleDateString() : '-'}</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><Button asChild variant="outline" size="sm"><Link href={`/admin/hostel/students/${alloc._id}`}>View</Link></Button><Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeallocate(alloc._id)}>Remove</Button></div></td></tr>))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}
