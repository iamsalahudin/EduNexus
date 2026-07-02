"use client"

import {
  Button,
  Card,
  Input,
  Select,
  Skeleton,
  ToggleBox,
  Table,
  TableRoot,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui'

export default function TeacherMasterCard({
  loading,
  teachers,
  q,
  onQueryChange,
  onSearch,
  onRefresh,
  onEdit,
  selected,
  editName,
  editEmail,
  editActive,
  editClass,
  editSection,
  editSections,
  classes,
  onEditNameChange,
  onEditEmailChange,
  onEditClassChange,
  onEditSectionChange,
  onEditActiveToggle,
  onEditSubmit,
  onEditCancel,
}) {
  const rows = Array.isArray(teachers) ? teachers : []
  const classRows = Array.isArray(classes) ? classes : []
  const sectionRows = Array.isArray(editSections) ? editSections : []

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">Teacher Master</h2>
          <p className="text-sm text-gray-600 mt-1">Search and edit teachers.</p>
        </div>
        <Button onClick={onRefresh}>Refresh</Button>
      </div>

      <div className="mt-4 flex gap-2">
        <Input placeholder="Search" value={q} onChange={(e) => onQueryChange(e.target.value)} />
        <Button onClick={onSearch}>Search</Button>
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
                <TableHeader>Username</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Class</TableHeader>
                <TableHeader>Section</TableHeader>
                <TableHeader>Active</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="whitespace-nowrap">{row.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.username || ''}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.email}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.profile?.class || ''}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.profile?.section || ''}</TableCell>
                  <TableCell className="whitespace-nowrap">{String(row.active ?? true)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => onEdit(row)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
          {rows.length === 0 ? (
            <div className="text-sm text-gray-600 mt-3">No teachers found.</div>
          ) : null}
        </Table>
      )}

      {selected ? (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium">Edit Teacher</h3>
          <form className="mt-3 space-y-3" onSubmit={onEditSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Name" value={editName} onChange={(e) => onEditNameChange(e.target.value)} required />
              <Input placeholder="Email" value={editEmail} onChange={(e) => onEditEmailChange(e.target.value)} required />
              <Select value={editClass} onChange={(e) => onEditClassChange(e.target.value)}>
                <option value="">Class (optional)</option>
                {classRows.map((row) => (
                  <option key={row._id} value={row.name}>
                    {row.name}
                  </option>
                ))}
              </Select>
              <Select
                value={editSection}
                onChange={(e) => onEditSectionChange(e.target.value)}
                disabled={!editClass || sectionRows.length === 0}
              >
                <option value="">
                  {!editClass ? 'Select class first' : sectionRows.length === 0 ? 'No sections' : 'Section (optional)'}
                </option>
                {sectionRows.map((row) => (
                  <option key={row} value={row}>
                    {row}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ToggleBox active={editActive} onToggle={onEditActiveToggle}>Active</ToggleBox>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" type="submit">
                Save
              </Button>
              <Button type="button" onClick={onEditCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </Card>
  )
}
