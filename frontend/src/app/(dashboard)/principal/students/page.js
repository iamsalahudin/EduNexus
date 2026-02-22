"use client"

import { useEffect, useState } from 'react'
import studentsService from '@/services/studentsService'
import { Button, Card, Input, PageHeader, Skeleton } from '@/components/ui'

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [q, setQ] = useState('')
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { students: list } = await studentsService.listStudents({
        q: q || undefined,
        classId: classId || undefined,
        section: section || undefined,
        limit: 200
      })
      setStudents(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <PageHeader title="Students" subtitle="View student master data." />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">Student List</h2>
            <p className="text-sm text-gray-600 mt-1">Read-only view.</p>
          </div>
          <Button onClick={load}>Refresh</Button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder="Class" value={classId} onChange={(e) => setClassId(e.target.value)} />
          <Input placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button onClick={load}>Apply Filters</Button>
        </div>

        {loading ? (
          <div className="mt-4"><Skeleton className="h-24" /></div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Student ID</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Section</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{s.studentId}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{s.firstName} {s.lastName}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{s.class}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{s.section}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{s.status || 'active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 ? <div className="text-sm text-gray-600 mt-3">No students found.</div> : null}
          </div>
        )}
      </Card>
    </div>
  )
}


