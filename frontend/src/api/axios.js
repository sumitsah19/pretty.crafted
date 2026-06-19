import axios from 'axios'
import { getToken, clearToken } from './tokenStore'

const MAX_RETRIES = 3
const RETRYABLE = new Set([408, 429, 502, 503, 504])

// In dev:  VITE_API_BASE_URL is unset  → baseURL = '/api'  (Vite proxy → localhost:8080/api)
// In prod: VITE_API_BASE_URL = 'https://api.prettycrafted.com'
//          → auto-appends '/api' → 'https://api.prettycrafted.com/api'
// Handles both 'https://api.prettycrafted.com' and 'https://api.prettycrafted.com/api'
const _envUrl = import.meta.env.VITE_API_BASE_URL
const baseURL = _envUrl
  ? _envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/api'
  : '/api'

const api = axios.create({
  baseURL,
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
      // A 401 from a credential endpoint just means "wrong credentials" — it must not
      // nuke an existing session or fire a global logout (e.g. a failed login attempt).
      const isCredentialAttempt = /\/auth\/(login|google|otp\/verify)/.test(config?.url || '')
      if (!isCredentialAttempt) {
        clearToken()
        window.dispatchEvent(new Event('pc:logout'))
      }
      return Promise.reject(err)
    }

    const isNetworkError = !err.response
    const isRetryable = isNetworkError || RETRYABLE.has(err.response?.status)
    // Only retry idempotent requests. A timed-out POST (order create, payment verify…)
    // may already have been processed server-side — retrying it can double-submit.
    const isIdempotent = ['get', 'head', 'options'].includes((config?.method || 'get').toLowerCase())

    if (isRetryable && isIdempotent && config && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1
      const delay = Math.min(1000 * 2 ** (config._retryCount - 1), 8000)
      await new Promise((r) => setTimeout(r, delay))
      return api(config)
    }

    return Promise.reject(err)
  }
)

export default api
