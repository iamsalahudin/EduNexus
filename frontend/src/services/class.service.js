<<<<<<< HEAD
import { api } from './api'

const classService = {
  getSummary: async () => {
    const { data } = await api.get('/classes/summary')
    return data
  },

  listClasses: async (params = {}) => {
    const { data } = await api.get('/classes', { params })
    return data
  },

  getClass: async (id) => {
    const { data } = await api.get(`/classes/${id}`)
    return data
  },

  getClassTeachers: async (id) => {
    const { data } = await api.get(`/classes/${id}/teachers`)
    return data
  },

  assignTeacher: async (classId, payload = {}) => {
    const { data } = await api.post(`/classes/${classId}/assign-teacher`, payload)
    return data
  },

  unassignTeacher: async (classId, payload = {}) => {
    const { data } = await api.post(`/classes/${classId}/unassign-teacher`, payload)
    return data
  },

  createClass: async (payload = {}) => {
    const { data } = await api.post('/classes', payload)
    return data
  },

  updateClass: async (id, payload = {}) => {
    const { data } = await api.patch(`/classes/${id}`, payload)
    return data
  },

  deleteClass: async (id) => {
    const { data } = await api.delete(`/classes/${id}`)
    return data
  }
}

export default classService
=======
import { api } from './api'

const classService = {
  getSummary: async () => {
    const { data } = await api.get('/classes/summary')
    return data
  },

  listClasses: async (params = {}) => {
    const { data } = await api.get('/classes', { params })
    return data
  },

  getClass: async (id) => {
    const { data } = await api.get(`/classes/${id}`)
    return data
  },

  getClassTeachers: async (id) => {
    const { data } = await api.get(`/classes/${id}/teachers`)
    return data
  },

  assignTeacher: async (classId, payload = {}) => {
    const { data } = await api.post(`/classes/${classId}/assign-teacher`, payload)
    return data
  },

  unassignTeacher: async (classId, payload = {}) => {
    const { data } = await api.post(`/classes/${classId}/unassign-teacher`, payload)
    return data
  },

  createClass: async (payload = {}) => {
    const { data } = await api.post('/classes', payload)
    return data
  },

  updateClass: async (id, payload = {}) => {
    const { data } = await api.patch(`/classes/${id}`, payload)
    return data
  },

  deleteClass: async (id) => {
    const { data } = await api.delete(`/classes/${id}`)
    return data
  }
}

export default classService
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
