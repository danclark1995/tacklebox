/**
 * Guidance Service
 */

import { apiFetch } from './apiFetch'

export async function listSections() {
  const data = await apiFetch('/guidance')
  if (!data.success) throw new Error(data.error || 'Failed to fetch guidance')
  return data.data
}

export async function updateSection(sectionKey, body) {
  const data = await apiFetch(`/guidance/${encodeURIComponent(sectionKey)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update guidance')
  return data.data
}
