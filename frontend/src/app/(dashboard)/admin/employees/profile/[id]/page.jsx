'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import employeeService from '@/services/employeeService'

export default function EmployeeProfilePage() {
  const { id } = useParams()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await employeeService.getEmployee(id)
        setEmployee(res?.staff || res?.employee || res || null)
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Unable to load employee profile.')
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  return (
    <div>
      <PageHeader
        title="Employee Profile"
        subtitle="View employee details and open the edit form."
        right={<ButtonLink href={`/admin/employees/${id}`} variant="secondary">Edit Employee</ButtonLink>}
      />

      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6">
        {loading ? <Skeleton className="h-80" /> : employee ? (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><div className="text-gray-500">Name</div><div className="font-medium">{employee.name || '-'}</div></div>
              <div><div className="text-gray-500">Employee ID</div><div className="font-medium">{employee.employeeId || '-'}</div></div>
              <div><div className="text-gray-500">Designation</div><div className="font-medium">{employee.designation || '-'}</div></div>
              <div><div className="text-gray-500">Department</div><div className="font-medium">{employee.department || '-'}</div></div>
              <div><div className="text-gray-500">Staff Type</div><div className="font-medium capitalize">{employee.staffType || '-'}</div></div>
              <div><div className="text-gray-500">Status</div><div className="font-medium capitalize">{employee.status || '-'}</div></div>
              <div><div className="text-gray-500">Monthly Salary</div><div className="font-medium">{employee.monthlySalary ?? '-'}</div></div>
              <div><div className="text-gray-500">Advance Balance</div><div className="font-medium">{employee.advanceBalance ?? '-'}</div></div>
              <div><div className="text-gray-500">Bank Name</div><div className="font-medium">{employee.bankName || '-'}</div></div>
              <div><div className="text-gray-500">Bank Account</div><div className="font-medium">{employee.bankAccount || '-'}</div></div>
              <div className="md:col-span-2"><div className="text-gray-500">Notes</div><div className="font-medium whitespace-pre-wrap">{employee.notes || '-'}</div></div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-sm text-gray-600">Employee not found.</div>
          </Card>
        )}
      </div>
    </div>
  )
}
