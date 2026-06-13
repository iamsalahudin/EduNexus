"use client"

import { Button, Card, Input, Select } from '@/components/ui'

export default function TeacherCreateCard({
  classes,
  sections,
  newName,
  newUsername,
  newEmail,
  newPassword,
  newClass,
  newSection,
  onNameChange,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onClassChange,
  onSectionChange,
  onSubmit,
}) {
  const classRows = Array.isArray(classes) ? classes : []
  const sectionRows = Array.isArray(sections) ? sections : []

  return (
    <Card>
      <h2 className="font-medium">Create Teacher</h2>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Name" value={newName} onChange={(e) => onNameChange(e.target.value)} required />
          <Input placeholder="Username" value={newUsername} onChange={(e) => onUsernameChange(e.target.value)} required />
          <Input placeholder="Email" value={newEmail} onChange={(e) => onEmailChange(e.target.value)} required />
          <Input
            placeholder="Password"
            type="password"
            value={newPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
          />
          <Select value={newClass} onChange={(e) => onClassChange(e.target.value)}>
            <option value="">Class (optional)</option>
            {classRows.map((row) => (
              <option key={row._id} value={row.name}>
                {row.name}
              </option>
            ))}
          </Select>
          <Select
            value={newSection}
            onChange={(e) => onSectionChange(e.target.value)}
            disabled={!newClass || sectionRows.length === 0}
          >
            <option value="">
              {!newClass ? 'Select class first' : sectionRows.length === 0 ? 'No sections' : 'Section (optional)'}
            </option>
            {sectionRows.map((row) => (
              <option key={row} value={row}>
                {row}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="primary" type="submit">
          Create
        </Button>
      </form>
    </Card>
  )
}
