/**
 * Generate Service — AI Content Creation
 */

import { apiFetch } from './apiFetch'

export async function generateContent(body) {
  const data = await apiFetch('/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to generate content')
  return data.data
}

export async function generateAd(body) {
  const data = await apiFetch('/generate/ad', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to generate ad')
  return data.data
}

export async function generateDocument(body) {
  const data = await apiFetch('/generate/document', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to generate document')
  return data.data
}

export async function generatePresentation(body) {
  const data = await apiFetch('/generate/presentation', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to generate presentation')
  return data.data
}

export async function generateSocial(body) {
  const data = await apiFetch('/generate/social', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to generate social post')
  return data.data
}

export async function getHistory(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  const data = await apiFetch(`/generate/history${params ? `?${params}` : ''}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch history')
  return data.data
}

export async function attachToTask(generationId, taskId) {
  const data = await apiFetch('/generate/attach-to-task', {
    method: 'POST',
    body: JSON.stringify({ generation_id: generationId, task_id: taskId }),
  })
  if (!data.success) throw new Error(data.error || 'Failed to attach to task')
  return data.data
}

export async function deleteGeneration(id) {
  const data = await apiFetch(`/generate/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete generation')
  return data.data
}
