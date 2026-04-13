"use client"

import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, StatCard, Skeleton } from '@/components/ui'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function WardenAttendanceHub() {
  const today = toInputDate(new Date())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Placeholder data structure - will be replaced with actual API calls
        // once hostel attendance backend is implemented
        const mockData = {
          totalHostellers: 150,
          presentToday: 145,
          absentToday: 5,
          checkedInToday: 142,
          checkedOutToday: 138,
          pendingCheckOut: 4
        }
        if (mounted) {
          setSummary(mockData)
        }
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.error || e.message || 'Failed to load hostel summary')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        title="Hostel Attendance"
        subtitle="Manage and monitor hostel check-in/check-out and daily attendance."
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard label="Total Hostellers" value={summary?.totalHostellers || 0} />
            <StatCard label="Present Today" value={summary?.presentToday || 0} />
            <StatCard label="Absent Today" value={summary?.absentToday || 0} />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard label="Checked In Today" value={summary?.checkedInToday || 0} />
            <StatCard label="Pending Check-Out" value={summary?.pendingCheckOut || 0} />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <h3 className="font-medium">Daily Check-In/Out</h3>
          <p className="text-sm text-gray-600 mt-1">Mark hostel check-in and check-out times for hostellers.</p>
          <div className="mt-4">
            <ButtonLink href="/warden/attendance/checkin-checkout" variant="secondary">
              Manage Check-In/Out
            </ButtonLink>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium">Room-wise Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">View attendance by hostel rooms and blocks.</p>
          <div className="mt-4">
            <ButtonLink href="/warden/attendance/rooms" variant="secondary">
              View Rooms
            </ButtonLink>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium">Hostel Reports</h3>
          <p className="text-sm text-gray-600 mt-1">Generate hostel attendance reports and analytics.</p>
          <div className="mt-4">
            <ButtonLink href="/warden/attendance/reports" variant="secondary">
              View Reports
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  )
}
