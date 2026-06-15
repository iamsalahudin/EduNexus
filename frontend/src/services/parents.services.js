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

const parentService = {
  getSummary: async () => {
    const { data } = await api.get('/parents/summary')
    return data
  },

  listParents: async (params = {}) => {
    const { data } = await api.get('/parents', { params })
    return data
  },

  getParent: async (id) => {
    const { data } = await api.get(`/parents/${id}`)
    return data
  },

  updateParent: async (id, payload = {}, files = []) => {
    const formData = toFormData(payload)
    ;(files || []).forEach((file) => {
      formData.append('documents', file)
    })

    const { data } = await api.patch(`/parents/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  deleteParent: async (id) => {
    const { data } = await api.delete(`/parents/${id}`)
    return data
  },
}

export default parentService