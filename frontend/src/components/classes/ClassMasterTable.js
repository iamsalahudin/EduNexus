"use client"

import {
  Button,
  Card,
  Skeleton,
  Table,
  TableRoot,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui'

export default function ClassMasterTable({
  loading,
  classes,
  selectedId,
  onEdit,
  onDelete,
  onRefresh,
}) {
  const rows = Array.isArray(classes) ? classes : []

  return (
    <Card className="lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">Class Master</h2>
          <p className="text-sm text-gray-600 mt-1">Click Edit to update a class on the right.</p>
        </div>
        <Button type="button" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="mt-4">
          <Skeleton className="h-24" />
        </div>
      ) : (
        <Table className="mt-4">
          <TableRoot className="min-w-full text-sm">
            <TableHead>
              <TableRow className="text-left text-gray-600">
                <TableHeader>Name</TableHeader>
                <TableHeader>Level</TableHeader>
                <TableHeader>Sections</TableHeader>
                <TableHeader>Active</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row._id}
                  className={selectedId === row._id ? 'bg-blue-50' : ''}
                >
                  <TableCell className="whitespace-nowrap">{row.name}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.level || <span className="text-gray-500">(none)</span>}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(row.sections) && row.sections.length > 0
                      ? row.sections.join(', ')
                      : <span className="text-gray-500">(none)</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{String(row.active ?? true)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => onEdit(row)}>
                        Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => onDelete(row)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
          {rows.length === 0 ? (
            <div className="text-sm text-gray-600 mt-3">No classes found.</div>
          ) : null}
        </Table>
      )}
    </Card>
  )
}
