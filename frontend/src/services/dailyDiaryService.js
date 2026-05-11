<<<<<<< HEAD
import { api } from './api'

export const dailyDiaryService = {
  list: async (params = undefined) => {
    const { data } = await api.get('/daily-diary', params ? { params } : undefined)
    return data
  },

  get: async (id) => {
    const { data } = await api.get(`/daily-diary/${id}`)
    return data
  },

  create: async (payload) => {
    const { data } = await api.post('/daily-diary', payload)
    return data
  },

  update: async (id, payload) => {
    const { data } = await api.patch(`/daily-diary/${id}`, payload)
    return data
  },

  remove: async (id) => {
    const { data } = await api.delete(`/daily-diary/${id}`)
    return data
  }
}

export default dailyDiaryService
=======
import { api } from './api'

export const dailyDiaryService = {
  list: async (params = undefined) => {
    const { data } = await api.get('/daily-diary', params ? { params } : undefined)
    return data
  },

  get: async (id) => {
    const { data } = await api.get(`/daily-diary/${id}`)
    return data
  },

  create: async (payload) => {
    const { data } = await api.post('/daily-diary', payload)
    return data
  },

  update: async (id, payload) => {
    const { data } = await api.patch(`/daily-diary/${id}`, payload)
    return data
  },

  remove: async (id) => {
    const { data } = await api.delete(`/daily-diary/${id}`)
    return data
  }
}

export default dailyDiaryService
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
