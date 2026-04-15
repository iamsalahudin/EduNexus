import { api } from './api'

function toFormData(payload = {}) {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value))
      return
    }

    formData.append(key, value)
  })

  return formData
}

const teacherService = {
  getSummary: async () => {
    const { data } = await api.get('/teachers/summary')
    return data
  },

  listTeachers: async (params = {}) => {
    const { data } = await api.get('/teachers', { params })
    return data
  },

  getTeacher: async (id) => {
    const { data } = await api.get(`/teachers/${id}`)
    return data
  },

  createTeacher: async (payload = {}, files = []) => {
    const formData = toFormData(payload)
    ;(files || []).forEach((file) => {
      formData.append('documents', file)
    })

    const { data } = await api.post('/teachers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  updateTeacher: async (id, payload = {}, files = []) => {
    const formData = toFormData(payload)
    ;(files || []).forEach((file) => {
      formData.append('documents', file)
    })

    const { data } = await api.patch(`/teachers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  deleteTeacher: async (id) => {
    const { data } = await api.delete(`/teachers/${id}`)
    return data
  }
}

export default teacherService
