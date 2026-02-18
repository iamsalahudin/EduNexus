import { api } from './api'

export const classesService = {
  listClasses: async (params = undefined) => {
    const { data } = await api.get('/classes', params ? { params } : undefined)
    return data
  },

  createClass: async (payload) => {
    const { data } = await api.post('/classes', payload)
    return data
  },

  updateClass: async (id, payload) => {
    const { data } = await api.patch(`/classes/${id}`, payload)
    return data
  },

  deleteClass: async (id) => {
    const { data } = await api.delete(`/classes/${id}`)
    return data
  }
}

export default classesService
