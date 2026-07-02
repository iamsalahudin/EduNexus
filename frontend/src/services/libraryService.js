import { api } from './api'

export const libraryService = {
  listBooks: async (params = undefined) => {
    const { data } = await api.get('/library/books', params ? { params } : undefined)
    return data
  },

  createBook: async (payload) => {
    const { data } = await api.post('/library/books', payload)
    return data
  },

  updateBook: async (id, payload) => {
    const { data } = await api.patch(`/library/books/${id}`, payload)
    return data
  },

  deleteBook: async (id) => {
    const { data } = await api.delete(`/library/books/${id}`)
    return data
  },

  listIssues: async (params = undefined) => {
    const { data } = await api.get('/library/issues', params ? { params } : undefined)
    return data
  },

  issueBook: async (payload) => {
    const { data } = await api.post('/library/issues', payload)
    return data
  },

  returnBook: async (id, payload) => {
    const { data } = await api.patch(`/library/issues/${id}/return`, payload)
    return data
  },

  listFines: async () => {
    const { data } = await api.get('/library/fines')
    return data
  },

  payFine: async (id, amount) => {
    const { data } = await api.patch(`/library/fines/${id}/pay`, { amount })
    return data
  }
}

export default libraryService
