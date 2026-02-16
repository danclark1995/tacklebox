/**
 * Schedule Service
 *
 * Calendar time blocks and smart scheduling suggestions.
 */

import { apiFetch } from './apiFetch'

export async function listBlocks(start, end) {
  const data = await apiFetch(`/schedule?start=${start}&end=${end}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch schedule')
  return data.data
}

export async function createBlock(body) {
  const data = await apiFetch('/schedule', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create block')
  return data.data
}

export async function updateBlock(id, body) {
  const data = await apiFetch(`/schedule/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update block')
  return data.data
}

export async function deleteBlock(id) {
  const data = await apiFetch(`/schedule/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete block')
  return data.data
}

export async function getSuggestions(taskId) {
  const data = await apiFetch(`/schedule/suggestions/${taskId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch suggestions')
  return data.data
}
