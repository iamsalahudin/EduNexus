"use client"

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'

function toInputDateTime(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  const hh = String(dt.getHours()).padStart(2, '0')
  const min = String(dt.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export default function HostelCheckInOutPage() {
  const [date, setDate] = useState(toInputDateTime(new Date()).split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [checkInOutRecords, setCheckInOutRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  async function loadRecords() {
    setLoading(true)
    setError(null)
    try {
      // TODO: Replace with actual API call once hostel attendance endpoints are implemented
      // await fetchHostelCheckInOut({ date })
      
      // Mock data for now
      const mockRecords = [
        {
          _id: '1',
          hosteller: { name: 'Ahmed Hassan', rollNo: 'H001', room: '101' },
          date,
          checkInTime: '14:30',
          checkOutTime: null,
          status: 'checked-in'
        },
        {
          _id: '2',
          hosteller: { name: 'Fatima Khan', rollNo: 'H002', room: '102' },
          date,
          checkInTime: '15:00',
          checkOutTime: '17:45',
          status: 'checked-out'
        },
        {
          _id: '3',
          hosteller: { name: 'Ali Raza', rollNo: 'H003', room: '103' },
          date,
          checkInTime: null,
          checkOutTime: null,
          status: 'absent'
        }
      ]
      setCheckInOutRecords(mockRecords)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load check-in/out records')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn(hosteller) {
    setActionLoading(true)
    setError(null)
    try {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      
      // TODO: Call API endpoint
      // await markHostelCheckIn({ hosteller: hosteller._id, date, checkInTime: timeStr })
      
      setCheckInOutRecords(prev => 
        prev.map(r => r.hosteller.rollNo === hosteller.rollNo 
          ? { ...r, checkInTime: timeStr, status: 'checked-in' }
          : r
        )
      )
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to mark check-in')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCheckOut(hosteller) {
    setActionLoading(true)
    setError(null)
    try {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      
      // TODO: Call API endpoint
      // await markHostelCheckOut({ hosteller: hosteller._id, date, checkOutTime: timeStr })
      
      setCheckInOutRecords(prev =>
        prev.map(r => r.hosteller.rollNo === hosteller.rollNo
          ? { ...r, checkOutTime: timeStr, status: 'checked-out' }
          : r
        )
      )
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to mark check-out')
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = checkInOutRecords.filter(r =>
    !searchQuery || 
    r.hosteller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.hosteller.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Check-In / Check-Out"
        subtitle="Manage daily hostel check-in and check-out times."
        right={<ButtonLink href="/warden/attendance" variant="secondary">Back</ButtonLink>}
      />

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Search (Name/Roll No)"
            type="text"
            placeholder="Search hosteller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={loadRecords} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </Card>

      <Card className="mt-6">
        <h3 className="font-medium">Check-In/Out Records</h3>
        <div className="mt-3 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : filtered.length === 0 ? (
            <div className="text-sm text-gray-600">No records found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Roll No</th>
                  <th className="py-2 px-3">Room</th>
                  <th className="py-2 px-3">Check-In</th>
                  <th className="py-2 px-3">Check-Out</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r._id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-2 px-3">{r.hosteller.name}</td>
                    <td className="py-2 px-3">{r.hosteller.rollNo}</td>
                    <td className="py-2 px-3">{r.hosteller.room}</td>
                    <td className="py-2 px-3">{r.checkInTime || '-'}</td>
                    <td className="py-2 px-3">{r.checkOutTime || '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        r.status === 'checked-in' ? 'bg-green-100 text-green-800' :
                        r.status === 'checked-out' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 flex gap-2">
                      {!r.checkInTime ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleCheckIn(r.hosteller)}
                          disabled={actionLoading}
                        >
                          Check In
                        </Button>
                      ) : !r.checkOutTime ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleCheckOut(r.hosteller)}
                          disabled={actionLoading}
                        >
                          Check Out
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
