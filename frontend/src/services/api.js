import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api'

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

/**
 * Request interceptor: Attach JWT token from localStorage to every request
 */
instance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      // localStorage might not be available in some environments
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor: Handle 401 errors (token expired/invalid)
 */
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url || '')
      const isLoginAttempt = url.includes('/auth/login')
      const isOnLoginPage = typeof window !== 'undefined' && window.location?.pathname === '/login'

      // During an explicit login attempt, let the caller handle 401
      if (!isLoginAttempt) {
        try {
          localStorage.removeItem('accessToken')
        } catch (e) {}
        if (!isOnLoginPage) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export async function fetcher(url){
  const res = await instance.get(url)
  return res.data
}

export { instance as api }
export default instance
