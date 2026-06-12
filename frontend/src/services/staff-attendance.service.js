import { api } from './api'

const staffAttendanceService = {
  getSummary: async (params = {}) => {
    const { data } = await api.get('/staff-attendance/summary', { params })
    return data
  },

  listRecords: async (params = {}) => {
    const { data } = await api.get('/staff-attendance', { params })
    return data
  },

  createRecord: async (payload = {}) => {
    const { data } = await api.post('/staff-attendance', payload)
    return data
  },

  updateRecord: async (id, payload = {}) => {
    const { data } = await api.patch(`/staff-attendance/${id}`, payload)
    return data
  }
}

export default staffAttendanceService
