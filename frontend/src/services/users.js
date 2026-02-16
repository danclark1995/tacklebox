/**
 * Users Service
 *
 * User profiles, listing, and deactivation.
 */

import { apiFetch } from './apiFetch'

export async function createUser(body) {
  const data = await apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create user')
  return data.data
}

export async function listUsers(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  const data = await apiFetch(`/users${params ? `?${params}` : ''}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch users')
  return data.data
}

export async function updateProfile(userId, body) {
  const data = await apiFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update profile')
  return data.data
}

export async function deactivateUser(userId) {
  const data = await apiFetch(`/users/${userId}/deactivate`, { method: 'PATCH' })
  if (!data.success) throw new Error(data.error || 'Failed to deactivate user')
  return data.data
}
