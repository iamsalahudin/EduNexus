import { api } from './api'

export const timetableService = {
  listTimetables: async (params = undefined) => {
    const { data } = await api.get('/timetables', params ? { params } : undefined)
    return data
  },

  listTeacherPersonalTimetables: async (params = {}) => {
    const { data } = await api.get('/timetables', { params: { ...params, view: 'teacher-personal' } })
    return data
  },

  listStudentClassTimetables: async (params = {}) => {
    const { data } = await api.get('/timetables', { params: { ...params, view: 'student-class' } })
    return data
  },

  listParentChildTimetables: async (params = {}) => {
    const { data } = await api.get('/timetables', { params: { ...params, view: 'parent-child' } })
    return data
  },

  getTimetable: async (id) => {
    const { data } = await api.get(`/timetables/${id}`)
    return data
  },

  createTimetable: async (payload) => {
    const { data } = await api.post('/timetables', payload)
    return data
  },

  updateTimetable: async (id, payload) => {
    const { data } = await api.patch(`/timetables/${id}`, payload)
    return data
  },

  deleteTimetable: async (id) => {
    const { data } = await api.delete(`/timetables/${id}`)
    return data
  },
}

export default timetableService