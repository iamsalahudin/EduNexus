import { api } from './api'

const complaintService = {
  listComplaints: async (params = {}) => {
    const { data } = await api.get('/complaints', { params })
    return data
  },

  getComplaint: async (id) => {
    const { data } = await api.get(`/complaints/${id}`)
    return data
  },

  createComplaint: async (payload = {}) => {
    const { data } = await api.post('/complaints', payload)
    return data
  },

  submitComplaint: async (payload = {}) => {
    const { data } = await api.post('/complaints', payload)
    return data?.complaint || data
  },

  editComplaint: async (id, payload = {}) => {
    const { data } = await api.patch(`/complaints/${id}`, payload)
    return data?.complaint || data
  },

  addComment: async (id, message) => {
    const { data } = await api.post(`/complaints/${id}/comments`, { message })
    return data
  },

  assignComplaint: async (id, userId) => {
    const { data } = await api.patch(`/complaints/${id}/assign`, { userId })
    return data
  },

  changeStatus: async (id, status) => {
    const { data } = await api.patch(`/complaints/${id}/status`, { status })
    return data
  },
}

export default complaintService
