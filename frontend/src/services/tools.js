/**
 * Tools Service
 */

import { apiFetch } from './apiFetch'

export async function listTools() {
  const data = await apiFetch('/tools')
  if (!data.success) throw new Error(data.error || 'Failed to fetch tools')
  return data.data
}

export async function createTool(body) {
  const data = await apiFetch('/tools', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create tool')
  return data.data
}

export async function updateTool(id, body) {
  const data = await apiFetch(`/tools/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update tool')
  return data.data
}

export async function deleteTool(id) {
  const data = await apiFetch(`/tools/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete tool')
  return data.data
}
