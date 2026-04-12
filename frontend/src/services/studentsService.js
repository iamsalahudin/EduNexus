import { api } from './api'

export const studentsService = {
  getSummary: async () => {
    const { data } = await api.get('/students/summary')
    return data
  },

  generateCertificate: async (payload) => {
    const { data } = await api.post('/certificates/generate', payload)
    return data
  },

  listStudentCertificates: async (studentId, params = {}) => {
    const { data } = await api.get(`/certificates/student/${studentId}`, { params })
    return data
  },

  listRecentCertificates: async (params = {}) => {
    const { data } = await api.get('/certificates/recent', { params })
    return data
  },

  downloadCertificatePdf: async (certificateId) => {
    const { data } = await api.get(`/certificates/${certificateId}/pdf`, {
      responseType: 'blob'
    })
    return data
  },

  listStudents: async (params = {}) => {
    const { data } = await api.get('/students', { params })
    return data
  },

  getStudentById: async (studentId) => {
    const { data } = await api.get(`/students/${studentId}`)
    return data
  },

  searchParents: async (params = {}) => {
    const { data } = await api.get('/students/parents/search', { params })
    return data
  },

  admitStudent: async (payload, files = {}) => {
    const formData = new FormData()
    formData.append('user', JSON.stringify(payload?.user || {}))
    formData.append('student', JSON.stringify(payload?.student || {}))
    formData.append('parent', JSON.stringify(payload?.parent || {}))
    formData.append('fee', JSON.stringify(payload?.fee || {}))
    formData.append('transport', JSON.stringify(payload?.transport || {}))

    if (files?.profilePicture) {
      formData.append('profilePicture', files.profilePicture)
    }

    ;(files?.documents || []).forEach((file) => {
      formData.append('documents', file)
    })

    const { data } = await api.post('/students/admission', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  updateStudent: async (id, payload) => {
    const { data } = await api.patch(`/students/${id}`, payload)
    return data
  },

  deleteStudent: async (id) => {
    const { data } = await api.delete(`/students/${id}`)
    return data
  }
}

export default studentsService
