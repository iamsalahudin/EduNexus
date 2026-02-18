import { api } from './api'

/**
 * Login with email and password
 * Returns: { accessToken, user: { id, email, name, role } }
 */
export const authService = {
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload)
    if (data?.accessToken) {
      localStorage.setItem('accessToken', data.accessToken)
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
    }
    return data
  },

  /**
   * Logout and clear token
   */
  logout: async () => {
    const res = await api.post('/auth/logout')
    localStorage.removeItem('accessToken')
    delete api.defaults.headers.common.Authorization
    return res.data
  },

  /**
   * Refresh access token
   */
  refresh: async () => {
    const { data } = await api.post('/auth/refresh')
    if (data?.accessToken) {
      localStorage.setItem('accessToken', data.accessToken)
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
    }
    return data
  },

  /**
   * Get current logged-in user
   * Returns: { user: { id, email, name, role, schoolId, ... } }
   */
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },

  changePassword: async (payload) => {
    const { data } = await api.post('/auth/change-password', payload)
    return data
  }
}

// Named exports used by the auth reset flow pages
// (Backend routes may be implemented separately.)
export const verifyOtpApi = async (payload) => {
  const { data } = await api.post('/auth/verify-otp', payload)
  return data
}

export const resetPasswordApi = async (payload) => {
  const { data } = await api.post('/auth/reset-password', payload)
  return data
}

export default authService
