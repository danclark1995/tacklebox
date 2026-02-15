/**
 * apiFetch — Safe API fetch wrapper
 *
 * Handles: res.ok checking, non-JSON error responses (502/503 from Cloudflare),
 * request timeouts, and consistent error formatting.
 *
 * Usage:
 *   import { apiFetch } from '@/services/apiFetch'
 *   const data = await apiFetch('/tasks')          // GET
 *   const data = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({...}) })
 */

import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { API_TIMEOUT_MS } from '@/config/constants'

const TIMEOUT = API_TIMEOUT_MS || 30000

export async function apiFetch(path, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const headers = {
      ...getAuthHeaders(),
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    }

    const res = await fetch(apiEndpoint(path), {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!res.ok) {
      // Try to parse JSON error, fall back to status text
      let errorMessage
      try {
        const errorJson = await res.json()
        errorMessage = errorJson.error || errorJson.message || `Request failed (${res.status})`
      } catch {
        errorMessage = `Request failed: ${res.status} ${res.statusText}`
      }
      throw new Error(errorMessage)
    }

    // Handle empty responses (204 No Content)
    if (res.status === 204) return { success: true }

    const json = await res.json()
    return json
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw err
  }
}

export default apiFetch
