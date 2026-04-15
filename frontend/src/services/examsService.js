import { api } from './api'

export const examsService = {
  listConfigs: async (params = undefined) => {
    const { data } = await api.get('/exams/configs', params ? { params } : undefined)
    return data
  },

  ensureDefaultConfigs: async () => {
    const { data } = await api.post('/exams/configs/ensure-defaults')
    return data
  },

  updateConfig: async (id, payload) => {
    const { data } = await api.patch(`/exams/configs/${id}`, payload)
    return data
  },

  listExams: async (params = undefined) => {
    const { data } = await api.get('/exams', params ? { params } : undefined)
    return data
  },

  listSetupSummary: async (params) => {
    const { data } = await api.get('/exams/setup-summary', { params })
    return data
  },

  bulkSetupAllClasses: async (payload) => {
    const { data } = await api.post('/exams/bulk-setup', payload)
    return data
  },

  getExam: async (id) => {
    const { data } = await api.get(`/exams/${id}`)
    return data
  },

  getTeacherAssignments: async (params = undefined) => {
    const { data } = await api.get('/exams/teacher-assignments', params ? { params } : undefined)
    return data
  },

  getMarksSheet: async (examId, params) => {
    const { data } = await api.get(`/exams/${examId}/marks`, { params })
    return data
  },

  upsertMarks: async (examId, params, payload) => {
    const { data } = await api.put(`/exams/${examId}/marks`, payload, { params })
    return data
  },

  createExam: async (payload) => {
    const { data } = await api.post('/exams', payload)
    return data
  },

  updateExam: async (id, payload) => {
    const { data } = await api.patch(`/exams/${id}`, payload)
    return data
  },

  archiveExam: async (id) => {
    const { data } = await api.post(`/exams/${id}/archive`)
    return data
  },

  hardDeleteExam: async (id) => {
    const { data } = await api.delete(`/exams/${id}`)
    return data
  },

  openExam: async (id) => {
    const { data } = await api.post(`/exams/${id}/actions/open`)
    return data
  },

  lockExam: async (id) => {
    const { data } = await api.post(`/exams/${id}/actions/lock`)
    return data
  },

  submitExam: async (id) => {
    const { data } = await api.post(`/exams/${id}/actions/submit`)
    return data
  },

  approveExam: async (id) => {
    const { data } = await api.post(`/exams/${id}/actions/approve`)
    return data
  },

  publishExam: async (id) => {
    const { data } = await api.post(`/exams/${id}/actions/publish`)
    return data
  }
}

export default examsService
