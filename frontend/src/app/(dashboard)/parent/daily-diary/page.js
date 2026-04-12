"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import dailyDiaryService from '@/services/dailyDiaryService'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

export default function ParentDailyDiaryPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [children, setChildren] = useState([])
  const [diariesByChild, setDiariesByChild] = useState([])
  const [childId, setChildId] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await dailyDiaryService.list(childId ? { childId } : undefined)
      setChildren(Array.isArray(res?.children) ? res.children : [])
      setDiariesByChild(Array.isArray(res?.diariesByChild) ? res.diariesByChild : [])
      if (!childId && Array.isArray(res?.children) && res.children.length) {
        setChildId(String(res.children[0]._id || res.children[0].id || ''))
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load daily diary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId])

  const selectedList = useMemo(() => {
    const selected = diariesByChild.find((row) => String(row?.child?.id || row?.child?._id || '') === String(childId))
    return Array.isArray(selected?.diaries) ? selected.diaries : []
  }, [diariesByChild, childId])

  return (
    <div>
      <PageHeader title="Daily Diary" subtitle="Track each child daily diary (summary view)." right={<Button onClick={load} disabled={loading}>Refresh</Button>} />
      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-32" />
        ) : children.length === 0 ? (
          <div className="text-sm text-gray-600">No linked children found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Child</label>
              <Select className="mt-2" value={childId} onChange={(e) => setChildId(e.target.value)}>
                {children.map((child) => {
                  const id = String(child._id || child.id)
                  const name = child.name || [child.firstName, child.lastName].filter(Boolean).join(' ')
                  return <option key={id} value={id}>{child.studentId || '—'} - {name || 'Child'}</option>
                })}
              </Select>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="font-medium">Diary Summary</h2>
        <div className="mt-3 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : selectedList.length === 0 ? (
            <div className="text-sm text-gray-600">No diary entries found for selected child.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedList.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(row.date)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.class}-{row.section}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.subject || '—'}</td>
                    <td className="py-2 pr-3">{row.title || '—'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{row.status || '—'}</td>
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
