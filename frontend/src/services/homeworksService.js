import { api } from './api'

function normalizeApiPath(urlOrPath) {
  const raw = String(urlOrPath || '')
  if (!raw) return ''
  if (raw.startsWith('/api/')) return raw.slice(4)
  if (raw === '/api') return '/'
  return raw
}

export const homeworksService = {
  list: async (params = undefined) => {
    const { data } = await api.get('/homeworks', params ? { params } : undefined)
    return data
  },

  get: async (id, params = undefined) => {
    const { data } = await api.get(`/homeworks/${id}`, params ? { params } : undefined)
    return data
  },

  create: async (payload) => {
    const { data } = await api.post('/homeworks', payload)
    return data
  },

  update: async (id, payload) => {
    const { data } = await api.patch(`/homeworks/${id}`, payload)
    return data
  },

  uploadAttachments: async (id, fileList) => {
    const form = new FormData()
    Array.from(fileList || []).forEach((f) => form.append('files', f))
    const { data } = await api.post(`/homeworks/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  updateDraft: async (id, payload) => {
    const { data } = await api.put(`/homeworks/${id}/submission`, payload)
    return data
  },

  uploadSubmissionFiles: async (id, fileList) => {
    const form = new FormData()
    Array.from(fileList || []).forEach((f) => form.append('files', f))
    const { data } = await api.post(`/homeworks/${id}/submission/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  submit: async (id) => {
    const { data } = await api.post(`/homeworks/${id}/submit`)
    return data
  },

  cancel: async (id) => {
    const { data } = await api.post(`/homeworks/${id}/cancel`)
    return data
  },

  receive: async (id, payload) => {
    const { data } = await api.post(`/homeworks/${id}/receive`, payload)
    return data
  },

  returnSubmission: async (id, payload) => {
    const { data } = await api.post(`/homeworks/${id}/return`, payload)
    return data
  },

  fetchFileBlob: async (urlOrPath) => {
    const path = normalizeApiPath(urlOrPath)
    const { data, headers } = await api.get(path, { responseType: 'blob' })
    return { blob: data, contentType: headers?.['content-type'] }
  }
}

export default homeworksService
