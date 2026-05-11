<<<<<<< HEAD
import { api } from './api'

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
    const { data } = await api.post('/notifications/requests', payload)
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
    const { data } = await api.post('/notifications/broadcast', payload)
    return data
  },

  listBroadcast: async (params = undefined) => {
    const { data } = await api.get('/notifications/broadcast', params ? { params } : undefined)
    return data
  },

  updateBroadcast: async (id, payload) => {
    const { data } = await api.patch(`/notifications/broadcast/${id}`, payload)
    return data
  },

  deleteBroadcast: async (id) => {
    const { data } = await api.delete(`/notifications/broadcast/${id}`)
    return data
  },

  // Backward compatibility aliases
  adminCreateBroadcast: async (payload) => {
    const { data } = await api.post('/notifications/broadcast', payload)
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
=======
import { api } from './api'

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
    const { data } = await api.post('/notifications/requests', payload)
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
    const { data } = await api.post('/notifications/broadcast', payload)
    return data
  },

  listBroadcast: async (params = undefined) => {
    const { data } = await api.get('/notifications/broadcast', params ? { params } : undefined)
    return data
  },

  updateBroadcast: async (id, payload) => {
    const { data } = await api.patch(`/notifications/broadcast/${id}`, payload)
    return data
  },

  deleteBroadcast: async (id) => {
    const { data } = await api.delete(`/notifications/broadcast/${id}`)
    return data
  },

  // Backward compatibility aliases
  adminCreateBroadcast: async (payload) => {
    const { data } = await api.post('/notifications/broadcast', payload)
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
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
