import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api'

const instance = axios.create({
  baseURL: API_BASE_URL,
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
      // Token expired or invalid - clear and redirect to login
      try {
        localStorage.removeItem('accessToken')
      } catch (e) {}
      window.location.href = '/login'
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
