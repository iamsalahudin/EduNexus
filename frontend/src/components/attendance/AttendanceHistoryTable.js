"use client"

import { Card, Table, TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui'
import StatusBadge from '@/components/ui/StatusBadge'

export default function AttendanceHistoryTable({
  title,
  rows = [],
  columns = [],
  emptyMessage = 'No attendance records found.',
}) {
  const safeRows = Array.isArray(rows) ? rows : []
  const safeColumns = Array.isArray(columns) ? columns : []

  return (
    <Card className="mt-6">
      {title ? <h3 className="font-semibold mb-4">{title}</h3> : null}
      <Table>
        <TableRoot className="min-w-full text-sm">
          <TableHead>
            <TableRow className="text-left border-b bg-gray-50">
              {safeColumns.map((col) => (
                <TableHeader key={col.key || col.label} className={col.headerClassName || ''}>
                  {col.label}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {safeRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(1, safeColumns.length)} className="py-4 text-sm text-gray-600">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              safeRows.map((row, idx) => (
                <TableRow key={row?._id || row?.id || idx}>
                  {safeColumns.map((col) => {
                    const value = col.render ? col.render(row) : row?.[col.key]
                    if (col.type === 'status') {
                      const statusValue = String(value || '-')
                      return (
                        <TableCell key={col.key || col.label} className={col.className || ''}>
                          <StatusBadge status={statusValue} />
                        </TableCell>
                      )
                    }
                    return (
                      <TableCell key={col.key || col.label} className={col.className || ''}>
                        {value ?? '-'}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </TableRoot>
      </Table>
    </Card>
  )
}
