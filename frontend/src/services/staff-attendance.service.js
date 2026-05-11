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

  getRecord: async (id) => {
    const { data } = await api.get(`/staff-attendance/${id}`)
    return data
  },

  markPunchIn: async (staffId) => {
    const { data } = await api.post('/staff-attendance/punch-in', { staffId })
    return data
  },

  markPunchOut: async (staffId) => {
    const { data } = await api.post('/staff-attendance/punch-out', { staffId })
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
