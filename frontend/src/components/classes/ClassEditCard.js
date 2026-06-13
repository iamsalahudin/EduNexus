"use client"

import { Button, Card, Input, Select, Textarea, ToggleBox } from '@/components/ui'

export default function ClassEditCard({
  selected,
  levelOptions,
  editName,
  editLevel,
  editActive,
  editNoSections,
  editSectionsText,
  onChangeName,
  onChangeLevel,
  onToggleActive,
  onToggleNoSections,
  onChangeSectionsText,
  onSubmit,
  onCancel,
}) {
  const options = Array.isArray(levelOptions) ? levelOptions : []

  return (
    <Card>
      <h2 className="font-medium">Edit Class</h2>
      <p className="text-sm text-gray-600 mt-1">
        {selected
          ? `Editing: ${selected.name}`
          : 'Select a class from the table to edit it here.'}
      </p>

      {selected ? (
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <Input
            placeholder="Name"
            value={editName}
            onChange={(e) => onChangeName(e.target.value)}
            required
          />

          <Select value={editLevel} onChange={(e) => onChangeLevel(e.target.value)}>
            <option value="">Level (optional)</option>
            {options.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </Select>

          <div className="flex items-center gap-4 text-sm">
            <ToggleBox active={editActive} onToggle={onToggleActive}>
              Active
            </ToggleBox>
            <ToggleBox active={editNoSections} onToggle={onToggleNoSections}>
              No sections
            </ToggleBox>
          </div>

          <Textarea
            textareaClassName="min-h-[96px]"
            placeholder={'Sections (one per line)\nBoys\nGirls'}
            value={editSectionsText}
            onChange={(e) => onChangeSectionsText(e.target.value)}
            disabled={editNoSections}
          />

          <div className="flex gap-2">
            <Button variant="primary" type="submit">
              Save
            </Button>
            <Button type="button" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">No class selected</p>
        </div>
      )}
    </Card>
  )
}
