'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ButtonLink, PageHeader, Skeleton } from '@/components/ui'
import EmployeeForm from '@/components/employees/EmployeeForm'
import employeeService from '@/services/employeeService'

const INITIAL_FORM = {
  name: '',
  employeeId: '',
  designation: '',
  department: '',
  staffType: 'staff',
  monthlySalary: '',
  advanceBalance: '',
  status: 'active',
  bankName: '',
  bankAccount: '',
  notes: ''
}

function validateForm(form) {
  const errors = {}
  if (!String(form.name || '').trim()) errors.name = 'Employee name is required.'
  if (!String(form.employeeId || '').trim()) errors.employeeId = 'Employee ID is required.'
  if (!String(form.designation || '').trim()) errors.designation = 'Designation is required.'
  if (form.monthlySalary !== '' && Number(form.monthlySalary) < 0) errors.monthlySalary = 'Salary cannot be negative.'
  if (form.advanceBalance !== '' && Number(form.advanceBalance) < 0) errors.advanceBalance = 'Advance balance cannot be negative.'
  return errors
}

export default function AddEmployeePage() {
  const router = useRouter()
  const [form, setForm] = useState(INITIAL_FORM)
  const [departments, setDepartments] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    async function load() {
      try {
        const res = await employeeService.listDepartments()
        setDepartments(Array.isArray(res?.departments) ? res.departments : [])
      } catch {
        setDepartments([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const nextErrors = validateForm(form)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        monthlySalary: form.monthlySalary === '' ? undefined : Number(form.monthlySalary),
        advanceBalance: form.advanceBalance === '' ? undefined : Number(form.advanceBalance)
      }
      await employeeService.createEmployee(payload)
      setSuccess('Employee created successfully.')
      setTimeout(() => router.push('/admin/employees'), 1200)
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Unable to create employee.')
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Employee"
        subtitle="Hire a new employee and store their salary staff record."
        right={<ButtonLink href="/admin/employees" variant="secondary">Back</ButtonLink>}
      />

      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      <div className="mt-6">
        {loading ? <Skeleton className="h-96" /> : (
          <EmployeeForm
            mode="create"
            form={form}
            setForm={setForm}
            fieldErrors={fieldErrors}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/employees')}
            submitLabel="Create Employee"
            departments={departments}
          />
        )}
      </div>
    </div>
  )
}
