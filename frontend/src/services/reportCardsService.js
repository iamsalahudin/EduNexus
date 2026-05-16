import { api } from './api'

export const reportCardsService = {
  createOrUpdate: async (payload) => {
    const { data } = await api.post('/reports', payload)
    return data
  },

  listReportCards: async (params = undefined) => {
    const { data } = await api.get('/reports', params ? { params } : undefined)
    return data
  },

  getReportCard: async (id) => {
    const { data } = await api.get(`/reports/${id}`)
    return data
  },

  approve: async (id) => {
    const { data } = await api.patch(`/reports/${id}/approve`)
    return data
  },

  reject: async (id, remarks) => {
    const { data } = await api.patch(`/reports/${id}/reject`, { remarks })
    return data
  },

  runArchive: async (years = 3) => {
    const { data } = await api.post('/reports/archive/run', { years })
    return data
  },
  exportPdf: async (params = {}) => {
    const res = await api.get('/reports/export/pdf', { params, responseType: 'blob' })
    return res.data
  },
  exportZip: async (params = {}) => {
    const res = await api.get('/reports/export/zip', { params, responseType: 'blob' })
    return res.data
  },
}

export default reportCardsService
