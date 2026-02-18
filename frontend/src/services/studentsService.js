import { api } from './api'

export const studentsService = {
  listStudents: async (params = {}) => {
    const { data } = await api.get('/students', { params })
    return data
  },

  admitStudent: async (payload) => {
    const { data } = await api.post('/students/admission', payload)
    return data
  },

  updateStudent: async (id, payload) => {
    const { data } = await api.patch(`/students/${id}`, payload)
    return data
  }
}

export default studentsService
