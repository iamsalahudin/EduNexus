import { api } from './api'

export const subjectsService = {
  listSubjects: async (params = undefined) => {
    const { data } = await api.get('/subjects', params ? { params } : undefined)
    return data
  },

  createSubject: async (payload) => {
    const { data } = await api.post('/subjects', payload)
    return data
  },

  updateSubject: async (id, payload) => {
    const { data } = await api.patch(`/subjects/${id}`, payload)
    return data
  },

  deleteSubject: async (id) => {
    const { data } = await api.delete(`/subjects/${id}`)
    return data
  },

  reorderSubjects: async (payload) => {
    const { data } = await api.put('/subjects/reorder', payload)
    return data
  },

  applyDefaults: async (payload = {}) => {
    const { data } = await api.post('/subjects/apply-defaults', payload)
    return data
  }
}

export default subjectsService
