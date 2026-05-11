import { api } from './api'

export const syllabusService = {
  listSyllabus: async (params = undefined) => {
    const { data } = await api.get('/syllabus', params ? { params } : undefined)
    return data
  },

  createSyllabus: async (payload) => {
    const { data } = await api.post('/syllabus', payload)
    return data
  },

  updateSyllabus: async (id, payload) => {
    const { data } = await api.patch(`/syllabus/${id}`, payload)
    return data
  },

  deleteSyllabus: async (id) => {
    const { data } = await api.delete(`/syllabus/${id}`)
    return data
  }
}

export default syllabusService