'use client'

import { useEffect, useState } from 'react'
import teacherService from '@/services/teacher.service'
import {
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from '@/components/ui'

export default function SubjectsPage() {
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [error, setError] = useState('')

  async function loadSubjects() {
    setLoading(true)
    setError('')
    try {
      const res = await teacherService.getMySubjects()
      setSubjects(Array.isArray(res?.subjects) ? res.subjects : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Subject assignments are not available yet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subjects"
        subtitle="Subjects assigned to you."
      />

      {error ? <div className="text-sm text-amber-700">{error}</div> : null}

      <Card>
        {loading ? (
          <Skeleton className="h-32" />
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No subjects assigned"
            description="When subject assignments are added, they will show up here."
          />
        ) : (
          <Table className="mt-2">
            <TableRoot className="min-w-full text-sm">
              <TableHead>
                <TableRow className="text-left text-gray-600">
                  <TableHeader>Subject</TableHeader>
                  <TableHeader>Class</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.map((row, idx) => (
                  <TableRow key={`${row.name}-${row.className || idx}`}>
                    <TableCell className="whitespace-nowrap font-medium">{row.name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.className || <span className="text-gray-500">(unassigned)</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          </Table>
        )}
      </Card>
    </div>
  )
}
