"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'

async function fetchTimetableSummary() {
  return new Promise((res) =>
    setTimeout(() => {
      res({
        totalClasses: 42,
        activeTimetables: 36,
        draftTimetables: 6,
        conflictCount: 4,
        lastUpdated: "2 hours ago",
        timetables: [
          {
            id: 1,
            class: "TT-Primary-26",
            year: "2024-25",
            status: "Published",
            updatedAt: "2024-09-10",
          },
        ],
      })
    }, 300)
  )
}

export default function TimetableHome() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true
    fetchTimetableSummary().then((d) => mounted && setData(d))
    return () => (mounted = false)
  }, [])

  const tableRows = useMemo(() => data?.timetables || [], [data])

  return (
    <div>
      {/* HEADER */}
      <PageHeader
        title="Timetable"
        subtitle="Manage class schedules, teacher allocation, and conflicts."
      />

      {/* 1️⃣ OVERVIEW CARDS */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          Total Classes
          <div className="text-xl font-semibold mt-1">
            {data ? data.totalClasses : "..."}
          </div>
        </Card>
        <Card>
          Active Timetables
          <div className="text-xl font-semibold mt-1">
            {data ? data.activeTimetables : "..."}
          </div>
        </Card>
        <Card>
          Draft Timetables
          <div className="text-xl font-semibold mt-1">
            {data ? data.draftTimetables : "..."}
          </div>
        </Card>
        <Card>
          Last Updated
          <div className="text-sm mt-2 text-gray-500">
            {data ? data.lastUpdated : "..."}
          </div>
        </Card>
      </div>

      {/* 2️⃣ QUICK ACTIONS */}
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/admin/timetable/create" variant="primary">
          + Create Timetable
        </ButtonLink>
        <ButtonLink href="/admin/timetable" variant="outline">
          View All
        </ButtonLink>
        <ButtonLink href="/admin/timetable/by-class" variant="outline">
          By Class
        </ButtonLink>
        <ButtonLink href="/admin/timetable/by-teacher" variant="outline">
          By Teacher
        </ButtonLink>
        <ButtonLink href="/admin/timetable/conflicts" variant="outline" className="hidden">
          Conflicts
        </ButtonLink>
      </div>

      {/* 3️⃣ FILTERS */}
      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <Select selectClassName="text-sm">
          <option>Academic Year</option>
          <option>2024-25</option>
          <option>2023-24</option>
        </Select>
        <Select selectClassName="text-sm">
          <option>Status</option>
          <option>Published</option>
          <option>Draft</option>
        </Select>
        <Input placeholder="Search class..." inputClassName="text-sm" />
      </div>

      {/* 4️⃣ TIMETABLE LIST */}
      <Card className="mt-6 overflow-x-auto">
        {!data ? (
          <Skeleton className="h-40" />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th className="py-2">Timetable</th>
                <th>Academic Year</th>
                <th>Status</th>
                <th>Last Modified</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.id} className="border-b last:border-none">
                  <td className="py-2">{row.class}</td>
                  <td>{row.year}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        row.status === "Published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>{row.updatedAt}</td>
                  <td className="text-right">
                    <ButtonLink
                      href={`/admin/timetable/edit/${row.id}`}
                      variant="outline"
                      size="sm"
                    >
                      Edit
                    </ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* 5️⃣ CONFLICT / ALERT PANEL */}
      <Card className="mt-6 border-l-4 border-[color:var(--color-cta)] hidden">
        <h3 className="font-medium flex items-center gap-2">
          <AlertTriangle size={16} className="text-[color:var(--color-cta)]" />
          Timetable Alerts
        </h3>
        <ul className="mt-2 text-sm text-gray-600 list-disc pl-4">
          <li>2 teacher double-bookings detected</li>
          <li>1 class missing science period</li>
          <li>Room conflict in Grade 9 timetable</li>
        </ul>
      </Card>
    </div>
  )
}
