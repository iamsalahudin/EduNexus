'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import hostelService from '@/services/hostelService'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ hostel: '', roomNumber: '', capacity: 1, type: 'shared' })

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [roomsRes, hostelsRes] = await Promise.all([hostelService.listRooms(), hostelService.listHostels()])
      setRooms(Array.isArray(roomsRes?.rooms) ? roomsRes.rooms : [])
      setHostels(Array.isArray(hostelsRes?.hostels) ? hostelsRes.hostels : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await hostelService.updateRoom(editingId, formData)
        setSuccess('Room updated')
      } else {
        await hostelService.createRoom(formData)
        setSuccess('Room created')
      }
      setEditingId(null)
      setFormData({ hostel: '', roomNumber: '', capacity: 1, type: 'shared' })
      loadData()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Room Management" subtitle="Manage rooms and capacity" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select value={formData.hostel} onChange={(e) => setFormData({ ...formData, hostel: e.target.value })} required>
              <option value="">Select hostel</option>
              {hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.name}</option>)}
            </Select>
            <Input placeholder="Room Number" value={formData.roomNumber} onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })} required />
            <Input type="number" min="1" placeholder="Capacity" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} required />
            <Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="single">Single</option>
              <option value="shared">Shared</option>
            </Select>
            <Button type="submit" className="w-full">{editingId ? 'Update Room' : 'Add Room'}</Button>
          </form>
        </Card>

        <Card className="md:col-span-2 p-4">
          {loading ? <Skeleton className="h-40" /> : rooms.length === 0 ? <div className="text-sm text-gray-600">No rooms.</div> : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rooms.map((room) => (
                <div key={room._id} className="rounded border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">Room {room.roomNumber}</div>
                      <div className="text-xs text-gray-500">{room.hostel?.name || 'Hostel'}</div>
                    </div>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs">{room.capacity} beds</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(room._id); setFormData({ hostel: room.hostel?._id || '', roomNumber: room.roomNumber, capacity: room.capacity, type: room.type || 'shared' }) }}>Edit</Button>
                    <Button size="sm" variant="outline">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
