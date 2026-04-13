"use client"

import { useEffect, useMemo, useState } from 'react'
import { ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import { fetchStaffAttendance } from '@/services/attendanceService'
import { api } from '@/services/api'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isNonTeaching(role) {
  const value = String(role || '').toLowerCase()
  if (!value) return false
  if (value.includes('teacher') || value.includes('student') || value.includes('parent')) return false
  if (value.includes('principal')) return false
  return true
}

export default function PrincipalStaffAttendanceView() {
  const [staffUsers, setStaffUsers] = useState([])
  const [date, setDate] = useState(toInputDate(new Date()))
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const monthStart = `${date.slice(0, 8)}01`

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await api.get('/users', { params: { limit: 1200 } })
        const users = res?.data?.users || []
        setStaffUsers(users.filter((user) => isNonTeaching(user?.role)))
      } catch (e) {
        setStaffUsers([])
      }
    }
    loadUsers()
  }, [])

  useEffect(() => {
    async function loadAttendance() {
      setLoading(true)
      setError(null)
      try {
        const [dayRes, monthRes] = await Promise.all([
          fetchStaffAttendance({ date }),
          fetchStaffAttendance({ fromDate: monthStart, toDate: date })
        ])

        const dayRecords = (dayRes?.records || []).filter((record) => isNonTeaching(record?.user?.role))
        const monthRecords = (monthRes?.records || []).filter((record) => isNonTeaching(record?.user?.role))

        const dayByUser = new Map()
        for (const rec of dayRecords) {
          dayByUser.set(String(rec?.user?._id), rec)
        }

        const monthByUser = new Map()
        for (const rec of monthRecords) {
          const uid = String(rec?.user?._id || '')
          if (!uid) continue
          if (!monthByUser.has(uid)) monthByUser.set(uid, { total: 0, present: 0 })
          const curr = monthByUser.get(uid)
          curr.total += 1
          if (String(rec.status || '').toLowerCase() === 'present') curr.present += 1
        }

        const merged = staffUsers.map((staff) => {
          const uid = String(staff._id)
          const day = dayByUser.get(uid)
          const monthly = monthByUser.get(uid) || { total: 0, present: 0 }
          const percentage = monthly.total > 0 ? ((monthly.present / monthly.total) * 100).toFixed(1) : '0.0'

          return {
            id: uid,
            name: staff?.name || '-',
            department: staff?.profile?.department || 'General',
            status: String(day?.status || 'not-marked').toLowerCase(),
            percentage: Number(percentage)
          }
        })

        setRows(merged)
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load staff attendance')
      } finally {
        setLoading(false)
      }
    }

    if (staffUsers.length > 0) loadAttendance()
    else setRows([])
  }, [staffUsers, date, monthStart])

  const departmentOptions = useMemo(() => {
    const values = Array.from(new Set(rows.map((row) => row.department).filter(Boolean)))
    return values.sort((a, b) => a.localeCompare(b))
  }, [rows])

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const searched = rows.filter((row) => {
      const byDept = !department || row.department === department
      const bySearch = !q || row.name.toLowerCase().includes(q)
      return byDept && bySearch
    })

    const sorted = [...searched]
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else sorted.sort((a, b) => b.percentage - a.percentage)
    return sorted
  }, [rows, search, department, sortBy])

  const maxDate = toInputDate(new Date())

  return (
    <div>
      <PageHeader
        title="Staff Attendance"
        subtitle="View-only non-teaching staff attendance by date and department."
        right={<ButtonLink href="/principal/attendance" variant="secondary">Back</ButtonLink>}
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Date" type="date" max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All Departments</option>
            {departmentOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff name" />
          <Select label="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="percentage">Attendance %</option>
          </Select>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Staff Attendance Status ({visibleRows.length})</h3>
        <div className="overflow-auto">
          {loading ? (
            <Skeleton className="h-56" />
          ) : visibleRows.length === 0 ? (
            <p className="text-sm text-gray-600">No staff data for selected filters.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-3 px-4 font-semibold">Staff Name</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">
                      <ButtonLink href={`/principal/attendance/staff/${row.id}`} variant="outline" size="sm">
                        {row.name}
                      </ButtonLink>
                    </td>
                    <td className="py-3 px-4">{row.department}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          row.status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : row.status === 'leave'
                            ? 'bg-amber-100 text-amber-700'
                            : row.status === 'absent' || row.status === 'late'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {row.status === 'not-marked' ? 'Not Marked' : row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{row.percentage.toFixed(1)}%</td>
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


