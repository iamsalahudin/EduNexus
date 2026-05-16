import { api } from './api'

function isFormData(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData
}

function buildBroadcastPayload(payload) {
  const formData = new FormData()
  const files = Array.isArray(payload?.attachments) ? payload.attachments : []

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (key === 'attachments') return
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item))
      return
    }

    formData.append(key, value)
  })

  files.forEach((file) => formData.append('attachments', file))
  return formData
}

export const notificationsService = {
  inbox: async (params = undefined) => {
    const { data } = await api.get('/notifications/inbox', params ? { params } : undefined)
    return data
  },

  markRead: async (id) => {
    const { data } = await api.post(`/notifications/${id}/read`)
    return data
  },

  dismiss: async (id) => {
    const { data } = await api.post(`/notifications/${id}/dismiss`)
    return data
  },

  createRequest: async (payload) => {
    const body = isFormData(payload) ? payload : payload
    const config = isFormData(body) ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    const { data } = await api.post('/notifications/requests', body, config)
    return data
  },

  listRequests: async (params = undefined) => {
    const { data } = await api.get('/notifications/requests', params ? { params } : undefined)
    return data
  },

  getRequest: async (id) => {
    const { data } = await api.get(`/notifications/requests/${id}`)
    return data
  },

  replyRequest: async (id, payload) => {
    const { data } = await api.post(`/notifications/requests/${id}/reply`, payload)
    return data
  },

  closeRequest: async (id) => {
    const { data } = await api.post(`/notifications/requests/${id}/close`)
    return data
  },

  createBroadcast: async (payload) => {
    const body = Array.isArray(payload?.attachments) || payload instanceof FormData ? payload : payload
    const requestBody = isFormData(body) ? body : (Array.isArray(payload?.attachments) ? buildBroadcastPayload(payload) : payload)
    const config = isFormData(requestBody) ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    const { data } = await api.post('/notifications/broadcast', requestBody, config)
    return data
  },

  listBroadcast: async (params = undefined) => {
    const { data } = await api.get('/notifications/broadcast', params ? { params } : undefined)
    return data
  },

  updateBroadcast: async (id, payload) => {
    const requestBody = isFormData(payload) ? payload : (Array.isArray(payload?.attachments) ? buildBroadcastPayload(payload) : payload)
    const config = isFormData(requestBody) ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    const { data } = await api.patch(`/notifications/broadcast/${id}`, requestBody, config)
    return data
  },

  deleteBroadcast: async (id) => {
    const { data } = await api.delete(`/notifications/broadcast/${id}`)
    return data
  },

  // Backward compatibility aliases
  adminCreateBroadcast: async (payload) => {
    const requestBody = isFormData(payload) ? payload : (Array.isArray(payload?.attachments) ? buildBroadcastPayload(payload) : payload)
    const config = isFormData(requestBody) ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    const { data } = await api.post('/notifications/broadcast', requestBody, config)
    return data
  },

  adminListBroadcast: async (params = undefined) => {
    const { data } = await api.get('/notifications/broadcast', params ? { params } : undefined)
    return data
  },

  adminDeleteBroadcast: async (id) => {
    const { data } = await api.delete(`/notifications/broadcast/${id}`)
    return data
  }
}

export default notificationsService
