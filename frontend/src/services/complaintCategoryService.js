import { api } from './api'

const complaintCategoryService = {
  listCategories: async () => {
    const { data } = await api.get('/complaint-categories')
    return data
  },

  createCategory: async (payload) => {
    const { data } = await api.post('/complaint-categories', payload)
    return data
  },

  updateCategory: async (id, payload) => {
    const { data } = await api.patch(`/complaint-categories/${id}`, payload)
    return data
  },

  deleteCategory: async (id) => {
    const { data } = await api.delete(`/complaint-categories/${id}`)
    return data
  },
}

export default complaintCategoryService
