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

export default function ClassesPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [error, setError] = useState('')

  async function loadClasses() {
    setLoading(true)
    setError('')
    try {
      const res = await teacherService.getMyClasses()
      setClasses(Array.isArray(res?.classes) ? res.classes : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Class assignments are not available yet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        subtitle="Classes assigned to you."
      />

      {error ? <div className="text-sm text-amber-700">{error}</div> : null}

      <Card>
        {loading ? (
          <Skeleton className="h-32" />
        ) : classes.length === 0 ? (
          <EmptyState
            title="No classes assigned"
            description="When class assignments are added, they will show up here."
          />
        ) : (
          <Table className="mt-2">
            <TableRoot className="min-w-full text-sm">
              <TableHead>
                <TableRow className="text-left text-gray-600">
                  <TableHeader>Class</TableHeader>
                  <TableHeader>Level</TableHeader>
                  <TableHeader>Sections</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell className="whitespace-nowrap">{row.name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.level || <span className="text-gray-500">(none)</span>}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(row.sections) && row.sections.length > 0
                        ? row.sections.join(', ')
                        : <span className="text-gray-500">(none)</span>}
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
