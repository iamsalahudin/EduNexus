import { api } from './api'

export const classesService = {
  listClasses: async (params = undefined, options = undefined) => {
    const { data } = await api.get('/classes', { ...(params ? { params } : {}), ...(options || {}) })
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
  },

  listLevels: async () => {
    const { data } = await api.get('/classes/levels')
    return data
  },

  updateLevels: async (payload) => {
    const { data } = await api.put('/classes/levels', payload)
    return data
  },

  listRooms: async () => {
    const { data } = await api.get('/classes/rooms')
    return data
  },

  updateRooms: async (payload) => {
    const { data } = await api.put('/classes/rooms', payload)
    return data
  }
}

export default classesService
