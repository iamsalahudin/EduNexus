"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Skeleton from "@/components/ui/Skeleton"
import { AlertTriangle } from "lucide-react"

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
      <h1 className="text-2xl font-semibold">Timetable</h1>
      <p className="text-sm text-gray-600 mt-1">
        Manage class schedules, teacher allocation, and conflicts.
      </p>

      {/* 1️⃣ OVERVIEW CARDS */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          Total Classes
          <div className="text-xl font-semibold mt-1">
            {data ? data.totalClasses : "..."}
          </div>
        </div>
        <div className="card">
          Active Timetables
          <div className="text-xl font-semibold mt-1">
            {data ? data.activeTimetables : "..."}
          </div>
        </div>
        <div className="card">
          Draft Timetables
          <div className="text-xl font-semibold mt-1">
            {data ? data.draftTimetables : "..."}
          </div>
        </div>
        <div className="card">
          Last Updated
          <div className="text-sm mt-2 text-gray-500">
            {data ? data.lastUpdated : "..."}
          </div>
        </div>
      </div>

      {/* 2️⃣ QUICK ACTIONS */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/timetable/create" className="px-4 py-2 rounded bg-[--color-primary] text-white">
          + Create Timetable
        </Link>
        <Link href="/admin/timetable" className="px-3 py-2 border rounded hover:text-[--color-primary] hover:border-[--color-primary]">
          View All
        </Link>
        <Link href="/admin/timetable/by-class" className="px-3 py-2 border rounded hover:text-[--color-primary] hover:border-[--color-primary]">
          By Class
        </Link>
        <Link href="/admin/timetable/by-teacher" className="px-3 py-2 border rounded hover:text-[--color-primary] hover:border-[--color-primary]">
          By Teacher
        </Link>
        <Link href="/admin/timetable/conflicts" className="px-3 py-2 border rounded hover:text-[--color-primary] hover:border-[--color-primary] hidden">
          Conflicts
        </Link>
      </div>

      {/* 3️⃣ FILTERS */}
      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <select className="border rounded px-3 py-2 text-sm">
          <option>Academic Year</option>
          <option>2024-25</option>
          <option>2023-24</option>
        </select>
        <select className="border rounded px-3 py-2 text-sm">
          <option>Status</option>
          <option>Published</option>
          <option>Draft</option>
        </select>
        <input
          placeholder="Search class..."
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* 4️⃣ TIMETABLE LIST */}
      <div className="mt-6 card overflow-x-auto">
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
                    <Link
                      href={`/admin/timetable/edit/${row.id}`}
                      className="text-[--color-primary] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 5️⃣ CONFLICT / ALERT PANEL */}
      <div className="mt-6 card border-l-4 border-[--color-cta] hidden">
        <h3 className="font-medium flex items-center gap-2">
          <AlertTriangle size={16} className="text-[--color-cta]" />
          Timetable Alerts
        </h3>
        <ul className="mt-2 text-sm text-gray-600 list-disc pl-4">
          <li>2 teacher double-bookings detected</li>
          <li>1 class missing science period</li>
          <li>Room conflict in Grade 9 timetable</li>
        </ul>
      </div>
    </div>
  )
}
