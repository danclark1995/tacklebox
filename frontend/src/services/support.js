/**
 * Support Service
 */

import { apiFetch } from './apiFetch'

export async function listMessages() {
  const data = await apiFetch('/support')
  if (!data.success) throw new Error(data.error || 'Failed to fetch support messages')
  return data.data
}

export async function createMessage(body) {
  const data = await apiFetch('/support', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to send support message')
  return data.data
}

export async function updateMessage(id, body) {
  const data = await apiFetch(`/support/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update support message')
  return data.data
}
