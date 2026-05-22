import axios from 'axios'
import { getToken, clearToken } from './tokenStore'

const MAX_RETRIES = 3
const RETRYABLE = new Set([408, 429, 502, 503, 504])

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config._retryCount = config._retryCount ?? 0
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config

    if (err.response?.status === 401) {
      clearToken()
      window.dispatchEvent(new Event('pc:logout'))
      return Promise.reject(err)
    }

    const isNetworkError = !err.response
    const isRetryable = isNetworkError || RETRYABLE.has(err.response?.status)

    if (isRetryable && config && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1
      const delay = Math.min(1000 * 2 ** (config._retryCount - 1), 8000)
      await new Promise((r) => setTimeout(r, delay))
      return api(config)
    }

    return Promise.reject(err)
  }
)

export default api
