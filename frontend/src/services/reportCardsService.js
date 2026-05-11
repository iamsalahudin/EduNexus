import { api } from './api'

export const reportCardsService = {
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
}

export default reportCardsService
