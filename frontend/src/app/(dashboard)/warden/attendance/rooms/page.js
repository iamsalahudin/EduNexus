"use client"

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'

export default function WardenRoomAttendancePage() {
  const [block, setBlock] = useState('A')
  const [roomData, setRoomData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const BLOCKS = [
    { value: 'A', label: 'Block A' },
    { value: 'B', label: 'Block B' },
    { value: 'C', label: 'Block C' },
    { value: 'D', label: 'Block D' }
  ]

  useEffect(() => {
    loadRoomData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block])

  async function loadRoomData() {
    setLoading(true)
    setError(null)
    try {
      // TODO: Replace with actual API call once hostel attendance endpoints are implemented
      // await fetchRoomAttendance({ block })

      // Mock data for now
      const mockRooms = [
        {
          _id: '101',
          roomNumber: '101',
          block,
          capacity: 2,
          occupants: 2,
          presentCount: 2,
          absenceCount: 0,
          occupants_list: ['Ahmed Hassan', 'Bilal Khan']
        },
        {
          _id: '102',
          roomNumber: '102',
          block,
          capacity: 2,
          occupants: 2,
          presentCount: 1,
          absenceCount: 1,
          occupants_list: ['Fatima Khan', 'Absent']
        },
        {
          _id: '103',
          roomNumber: '103',
          block,
          capacity: 3,
          occupants: 3,
          presentCount: 3,
          absenceCount: 0,
          occupants_list: ['Ali Raza', 'Sara Ahmed', 'Hassan Ali']
        }
      ]
      setRoomData(mockRooms)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load room data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Room-wise Attendance"
        subtitle="View attendance status by hostel rooms and blocks."
        right={<ButtonLink href="/warden/attendance" variant="secondary">Back</ButtonLink>}
      />

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Select Block" value={block} onChange={(e) => setBlock(e.target.value)}>
            {BLOCKS.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </Select>
          <div className="flex items-end">
            <Button variant="secondary" onClick={loadRoomData} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <div className="card">
              <div className="text-sm text-gray-500">Total Rooms</div>
              <div className="mt-2 text-2xl font-semibold">{roomData.length}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Total Occupants</div>
              <div className="mt-2 text-2xl font-semibold">
                {roomData.reduce((sum, r) => sum + r.occupants, 0)}
              </div>
            </div>
          </>
        )}
      </div>

      <Card className="mt-6">
        <h3 className="font-medium">Room Details - {block}</h3>
        <div className="mt-3 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : roomData.length === 0 ? (
            <div className="text-sm text-gray-600">No rooms found in this block.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomData.map((room) => (
                <div key={room._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{block}-{room.roomNumber}</h4>
                      <p className="text-xs text-gray-500">Capacity: {room.capacity}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      room.presentCount === room.occupants 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {room.presentCount}/{room.occupants}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Present:</span>
                      <span className="font-medium text-green-700">{room.presentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Absent:</span>
                      <span className="font-medium text-red-700">{room.absenceCount}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                    <p className="font-medium mb-1">Occupants:</p>
                    <ul className="space-y-1">
                      {room.occupants_list.map((occ, idx) => (
                        <li key={idx} className="text-gray-700">{occ}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
