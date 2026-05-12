import { api } from './api'
import {
  fetchSalaryStaff,
  upsertSalaryStaff as saveSalaryStaff
} from './salaryService'

const employeeService = {
  // List salary staff records used by the employee module
  listEmployees: async (params = {}) => {
    const staff = await fetchSalaryStaff(params)
    return { employees: staff, staff }
  },

  // Get single employee
  getEmployee: async (id) => {
    const { data } = await api.get(`/salary/staff/${id}`)
    return data
  },

  // Create new employee
  createEmployee: async (payload) => {
    const staff = await saveSalaryStaff(payload)
    return { staff }
  },

  // Update employee
  updateEmployee: async (id, payload) => {
    const staff = await saveSalaryStaff(payload, id)
    return { staff }
  },

  // Delete employee
  deleteEmployee: async (id) => {
    const { data } = await api.delete(`/salary/staff/${id}`)
    return data
  },

  // List departments
  listDepartments: async (params = {}) => {
    const { data } = await api.get('/departments', { params })
    return data
  },

  // Create department
  createDepartment: async (payload) => {
    const { data } = await api.post('/departments', payload)
    return data
  },

  // Update department
  updateDepartment: async (id, payload) => {
    const { data } = await api.patch(`/departments/${id}`, payload)
    return data
  },

  // Delete department
  deleteDepartment: async (id) => {
    const { data } = await api.delete(`/departments/${id}`)
    return data
  }
}

export default employeeService
