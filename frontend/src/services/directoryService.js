import { api } from './api'

export const directoryService = {
  listUsers: async (params = {}) => {
    const { data } = await api.get('/directory/users', { params })
    return data
  }
}

export default directoryService
