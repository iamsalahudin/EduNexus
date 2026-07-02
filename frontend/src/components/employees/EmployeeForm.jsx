'use client'

import { Button, Card, Input, Select, Textarea } from '@/components/ui'

const STAFF_TYPES = [
  { value: 'staff', label: 'Staff' },
  { value: 'teacher', label: 'Teacher' }
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

function FieldError({ message }) {
  if (!message) return null
  return <div className="mt-1 text-xs text-red-600">{message}</div>
}

export default function EmployeeForm({
  mode = 'create',
  form,
  setForm,
  fieldErrors = {},
  submitting = false,
  onSubmit,
  onCancel,
  submitLabel,
  departments = []
}) {
  const buttonText = submitLabel || (mode === 'edit' ? 'Update Employee' : 'Create Employee')

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={submitting}
              placeholder="Enter staff member name"
            />
            <FieldError message={fieldErrors.name} />
          </div>

          <div>
            <Input
              label="Employee ID"
              value={form.employeeId}
              onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
              disabled={submitting}
              placeholder="EMP-1001"
            />
            <FieldError message={fieldErrors.employeeId} />
          </div>

          <div>
            <Input
              label="Designation"
              value={form.designation}
              onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))}
              disabled={submitting}
              placeholder="Clerk, Accountant, Librarian"
            />
            <FieldError message={fieldErrors.designation} />
          </div>

          <div>
            <Input
              label="Department"
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              disabled={submitting}
              placeholder={departments.length ? 'Type or choose from the department list' : 'Administration'}
              list="employee-departments"
            />
            <FieldError message={fieldErrors.department} />
            {departments.length > 0 && (
              <datalist id="employee-departments">
                {departments.map((department) => (
                  <option key={department._id || department.id} value={department.name} />
                ))}
              </datalist>
            )}
          </div>

          <div>
            <Select
              label="Staff Type"
              value={form.staffType}
              onChange={(e) => setForm((prev) => ({ ...prev, staffType: e.target.value }))}
              disabled={submitting}
            >
              {STAFF_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={fieldErrors.staffType} />
          </div>

          <div>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              disabled={submitting}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={fieldErrors.status} />
          </div>

          <div>
            <Input
              label="Monthly Salary"
              type="number"
              min="0"
              step="0.01"
              value={form.monthlySalary}
              onChange={(e) => setForm((prev) => ({ ...prev, monthlySalary: e.target.value }))}
              disabled={submitting}
              placeholder="0"
            />
            <FieldError message={fieldErrors.monthlySalary} />
          </div>

          <div>
            <Input
              label="Advance Balance"
              type="number"
              min="0"
              step="0.01"
              value={form.advanceBalance}
              onChange={(e) => setForm((prev) => ({ ...prev, advanceBalance: e.target.value }))}
              disabled={submitting}
              placeholder="0"
            />
            <FieldError message={fieldErrors.advanceBalance} />
          </div>

          <div>
            <Input
              label="Bank Name"
              value={form.bankName}
              onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
              disabled={submitting}
              placeholder="Bank of Punjab"
            />
            <FieldError message={fieldErrors.bankName} />
          </div>

          <div>
            <Input
              label="Bank Account"
              value={form.bankAccount}
              onChange={(e) => setForm((prev) => ({ ...prev, bankAccount: e.target.value }))}
              disabled={submitting}
              placeholder="0000-0000000-0"
            />
            <FieldError message={fieldErrors.bankAccount} />
          </div>
        </div>

        <div>
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            disabled={submitting}
            rows={4}
            placeholder="Optional notes about this employee"
          />
          <FieldError message={fieldErrors.notes} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : buttonText}
          </Button>
        </div>
      </form>
    </Card>
  )
}
