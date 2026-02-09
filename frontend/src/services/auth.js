/**
 * Auth Service — Abstraction Layer
 *
 * Phase 1: Placeholder auth using user ID as token.
 * Phase 2: Swap to real JWT/OAuth without touching UI or API logic.
 *
 * All auth operations go through this service.
 */

import { apiEndpoint } from '@/config/env'

const TOKEN_KEY = 'tacklebox_auth_token'
const USER_KEY = 'tacklebox_user'

/**
 * Log in with email and password
 * Phase 1: Returns user data from API, stores user ID as token
 */
export async function login(email, password) {
  const url = apiEndpoint('/auth/login')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const text = await res.text()
    let message = 'Login failed'
    try {
      const json = JSON.parse(text)
      message = json.error || message
    } catch {
      // response was not JSON
    }
    throw new Error(message)
  }

  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Login failed')

  localStorage.setItem(TOKEN_KEY, data.data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.data.user))
  return data.data.user
}

/**
 * Log out — clear local session
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Get the current auth token
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Get the current user from local storage
 */
export function getCurrentUser() {
  const stored = localStorage.getItem(USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken()
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders() {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

/**
 * Check if current user has a specific role
 */
export function hasRole(...roles) {
  const user = getCurrentUser()
  if (!user) return false
  return roles.includes(user.role)
}

/**
 * Update stored user data (e.g., after profile edit)
 */
export function updateStoredUser(userData) {
  localStorage.setItem(USER_KEY, JSON.stringify(userData))
}

const authService = {
  login,
  logout,
  getToken,
  getCurrentUser,
  isAuthenticated,
  getAuthHeaders,
  hasRole,
  updateStoredUser,
}

export default authService
