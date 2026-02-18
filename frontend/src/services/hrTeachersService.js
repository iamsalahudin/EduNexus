import { api } from './api'

export const hrTeachersService = {
  listTeachers: async (params = {}) => {
    const { data } = await api.get('/hr/teachers', { params })
    return data
  },

  createTeacher: async (payload) => {
    const { data } = await api.post('/hr/teachers', payload)
    return data
  },

  updateTeacher: async (id, payload) => {
    const { data } = await api.patch(`/hr/teachers/${id}`, payload)
    return data
  }
}

export default hrTeachersService
