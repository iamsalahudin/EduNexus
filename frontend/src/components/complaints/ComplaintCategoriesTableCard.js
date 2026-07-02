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

export default function ComplaintCategoriesTableCard({
  categories,
  loading,
  onEdit,
  onDelete,
}) {
  const rows = Array.isArray(categories) ? categories : []

  return (
    <Card className="mt-6">
      {loading ? (
        <Skeleton className="h-40" />
      ) : (
        <Table>
          <TableRoot className="min-w-full text-sm">
            <TableHead>
              <TableRow className="text-left border-b">
                <TableHeader className="px-3">Name</TableHeader>
                <TableHeader className="px-3">Description</TableHeader>
                <TableHeader className="px-3">Active</TableHeader>
                <TableHeader className="px-3">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="px-3 font-medium">{row.name}</TableCell>
                  <TableCell className="px-3">{row.description || '-'}</TableCell>
                  <TableCell className="px-3">{row.active ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="px-3">
                    <Button onClick={() => onEdit(row)} variant="outline" size="sm">Edit</Button>
                    <Button onClick={() => onDelete(row._id)} variant="danger" size="sm" className="ml-2">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-4 text-sm text-gray-600">No categories found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </TableRoot>
        </Table>
      )}
    </Card>
  )
}
