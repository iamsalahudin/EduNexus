import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api'

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

const inflight = new Map()
const cache = new Map()
const DEFAULT_GET_CACHE_MS = 1500

function keyFor(config) {
  const method = String(config.method || 'get').toLowerCase()
  const url = config.baseURL ? `${config.baseURL}${config.url}` : config.url
  const params = config.params ? JSON.stringify(config.params) : ''
  const data = config.data && typeof config.data !== 'string' ? JSON.stringify(config.data) : (config.data || '')
  return `${method}::${url}::${params}::${data}`
}

instance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {}

    const method = String(config.method || 'get').toLowerCase()
    // Skip dedupe/cache for non-GET, explicit opt-outs, and any caller that brought its own AbortSignal --
    // sharing a promise across abort signals would let one caller's cancel cascade to the others.
    if (method !== 'get' || config.dedupe === false || config.signal) return config

    const k = keyFor(config)
    const ttl = Number.isFinite(config.cacheMs) ? config.cacheMs : DEFAULT_GET_CACHE_MS

    if (ttl > 0) {
      const hit = cache.get(k)
      if (hit && Date.now() - hit.at < ttl) {
        config.adapter = () => Promise.resolve({
          data: hit.data,
          status: 200,
          statusText: 'OK (cached)',
          headers: {},
          config,
          request: null,
          cached: true,
        })
        return config
      }
    }

    if (inflight.has(k)) {
      const existing = inflight.get(k)
      // If the shared in-flight promise rejects with cancellation, fall back to a fresh request for THIS caller
      // rather than propagating someone else's abort.
      config.adapter = () => existing.then(
        (response) => ({ ...response, config, cached: true }),
        (err) => {
          const isAbort = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError'
          if (!isAbort) throw err
          const retry = { ...config }
          delete retry.adapter
          retry.dedupe = false
          return instance.request(retry)
        }
      )
      return config
    }

    const pending = new Promise((resolve, reject) => {
      config._dedupeResolve = resolve
      config._dedupeReject = reject
    })
    inflight.set(k, pending)
    config._dedupeKey = k
    config._dedupeTtl = ttl
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor: Handle 401 errors (token expired/invalid)
 */
instance.interceptors.response.use(
  (response) => {
    const cfg = response.config || {}
    const k = cfg._dedupeKey
    if (k) {
      const ttl = cfg._dedupeTtl
      if (Number.isFinite(ttl) && ttl > 0) {
        cache.set(k, { at: Date.now(), data: response.data })
      }
      cfg._dedupeResolve?.(response)
      inflight.delete(k)
    }
    return response
  },
  (error) => {
    const cfg = error.config || {}
    const k = cfg._dedupeKey
    if (k) {
      cfg._dedupeReject?.(error)
      inflight.delete(k)
    }
    if (error.response?.status === 401) {
      const url = String(cfg.url || '')
      const isLoginAttempt = url.includes('/auth/login')
      const isOnLoginPage = typeof window !== 'undefined' && window.location?.pathname === '/login'
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

export function invalidateApiCache(predicate) {
  if (typeof predicate === 'function') {
    for (const k of Array.from(cache.keys())) if (predicate(k)) cache.delete(k)
  } else if (typeof predicate === 'string') {
    for (const k of Array.from(cache.keys())) if (k.includes(predicate)) cache.delete(k)
  } else {
    cache.clear()
  }
}

export async function fetcher(url){
  const res = await instance.get(url)
  return res.data
}

export { instance as api }
export default instance
