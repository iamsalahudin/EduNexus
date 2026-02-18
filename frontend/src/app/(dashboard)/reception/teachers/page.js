"use client"

import { useEffect, useState } from 'react'
import directoryService from '@/services/directoryService'
import Skeleton from '@/components/ui/Skeleton'

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { users } = await directoryService.listUsers({ role: 'Teacher', q: q || undefined, limit: 200 })
      setTeachers(Array.isArray(users) ? users : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teachers')
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
      <h1 className="text-2xl font-semibold">Teachers</h1>
      <p className="text-sm text-gray-600 mt-1">View teachers directory.</p>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <div className="card mt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">Teacher List</h2>
            <p className="text-sm text-gray-600 mt-1">Read-only view.</p>
          </div>
          <button className="px-3 py-2 border rounded hover-theme-primary" onClick={load}>Refresh</button>
        </div>

        <div className="mt-4 flex gap-2">
          <input className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="px-3 py-2 border rounded hover-theme-primary" onClick={load}>Search</button>
        </div>

        {loading ? (
          <div className="mt-4"><Skeleton className="h-24" /></div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Section</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t._id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{t.name}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{t.email}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{t.profile?.class || ''}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{t.profile?.section || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {teachers.length === 0 ? <div className="text-sm text-gray-600 mt-3">No teachers found.</div> : null}
          </div>
        )}
      </div>
    </div>
  )
}

