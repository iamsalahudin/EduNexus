"use client"

import {
  Card,
  Table,
  TableRoot,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui'

export default function TeacherAssignmentsTable({ rows }) {
  const items = Array.isArray(rows) ? rows : []

  return (
    <Card>
      <h2 className="font-medium">Class and Subject Assignment</h2>
      <p className="text-xs text-gray-600 mt-1">This will be updated from timetable configuration. Until then, it may remain empty.</p>

      {items.length === 0 ? (
        <div className="text-sm text-gray-600 mt-3">No class-subject assignments available yet.</div>
      ) : (
        <Table className="mt-3">
          <TableRoot className="min-w-full text-sm">
            <TableHead>
              <TableRow className="text-left border-b bg-gray-50">
                <TableHeader className="font-semibold">Class Assigned</TableHeader>
                <TableHeader className="font-semibold">Subject</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row, idx) => (
                <TableRow key={`${row.className}-${idx}`}>
                  <TableCell>{row.className || '-'}</TableCell>
                  <TableCell>{row.subjectName || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Table>
      )}
    </Card>
  )
}
