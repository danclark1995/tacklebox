/**
 * Templates Service
 */

import { apiFetch } from './apiFetch'

export async function listTemplates(categoryId) {
  const param = categoryId ? `?category_id=${categoryId}` : ''
  const data = await apiFetch(`/templates${param}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch templates')
  return data.data
}

export async function createTemplate(body) {
  const data = await apiFetch('/templates', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create template')
  return data.data
}

export async function updateTemplate(id, body) {
  const data = await apiFetch(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update template')
  return data.data
}

export async function deleteTemplate(id) {
  const data = await apiFetch(`/templates/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete template')
  return data.data
}
