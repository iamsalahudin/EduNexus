'use client'

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Skeleton } from '@/components/ui'
import employeeService from '@/services/employeeService'
import { Link } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchTerm, roleFilter])

  async function loadEmployees() {
    setLoading(true)
    setError('')
    try {
      const res = await employeeService.listEmployees({ limit: 500 })
      const empList = Array.isArray(res?.employees) ? res.employees : []
      setEmployees(empList)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  function filterEmployees() {
    let filtered = [...employees]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(term) ||
          emp.employeeId?.toLowerCase().includes(term) ||
          emp.designation?.toLowerCase().includes(term) ||
          emp.user?.name?.toLowerCase().includes(term) ||
          emp.user?.username?.toLowerCase().includes(term) ||
          emp.user?.email?.toLowerCase().includes(term)
      )
    }

    if (roleFilter) {
      filtered = filtered.filter((emp) => emp.role === roleFilter)
    }

    setFilteredEmployees(filtered)
  }

  const roles = [...new Set(employees.map((e) => e.role))].filter(Boolean)

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage non-teaching staff and support employees"
        right={<ButtonLink href="/principal/employees/add">+ Add Employee</ButtonLink>}
      />

      {error && <Card className="mt-6 bg-red-50 border border-red-200"><div className="text-sm text-red-700">{error}</div></Card>}
      {success && <Card className="mt-6 bg-green-50 border border-green-200"><div className="text-sm text-green-700">{success}</div></Card>}

      {/* Filters */}
      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Employees List */}
      <Card className="mt-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {employees.length === 0 ? 'No employees found.' : 'No matching employees.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Username</th>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Role</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id || emp._id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3">{emp.name}</td>
                    <td className="p-3">{emp.user?.username || '-'}</td>
                    <td className="p-3 text-blue-600 underline">
                      <a href={`mailto:${emp.user?.email || ''}`}>{emp.user?.email || '-'}</a>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded text-xs font-medium min-w-14" style={{
                        backgroundColor: emp.role === 'Admin' ? '#fef3c7' : '#dbeafe',
                        color: emp.role === 'Admin' ? '#92400e' : '#1e40af'
                      }}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2 flex justify-end">
                      <ButtonLink href={`/principal/employees/${emp.id || emp._id}`} variant="secondary" size="sm">
                        View
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {filteredEmployees.length > 0 && (
        <Card className="mt-6 bg-blue-50 border border-blue-200">
          <div className="text-sm text-blue-900">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </Card>
      )}
    </div>
  )
}
