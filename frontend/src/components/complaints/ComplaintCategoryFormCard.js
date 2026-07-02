"use client"

import { Button, Card, Input } from '@/components/ui'

export default function ComplaintCategoryFormCard({
  editing,
  form,
  onChange,
  onClose,
  onSave,
}) {
  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{editing ? 'Edit Category' : 'Add Category'}</h3>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
      <div className="space-y-3 mt-3">
        <Input label="Name" value={form.name} onChange={(e) => onChange('name', e.target.value)} />
        <Input label="Description" value={form.description} onChange={(e) => onChange('description', e.target.value)} />
        <Input label="Icon" value={form.icon} onChange={(e) => onChange('icon', e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSave}>{editing ? 'Save' : 'Create'}</Button>
        </div>
      </div>
    </Card>
  )
}
