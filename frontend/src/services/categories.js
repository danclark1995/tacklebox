/**
 * Categories Service
 */

import { apiFetch } from './apiFetch'

export async function listCategories(opts = {}) {
  const params = new URLSearchParams()
  if (opts.includeInactive) params.set('include_inactive', 'true')
  const qs = params.toString()
  const data = await apiFetch(`/categories${qs ? `?${qs}` : ''}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch categories')
  return data.data
}

export async function createCategory(body) {
  const data = await apiFetch('/categories', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create category')
  return data.data
}

export async function updateCategory(id, body) {
  const data = await apiFetch(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update category')
  return data.data
}

export async function deleteCategory(id) {
  const data = await apiFetch(`/categories/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete category')
  return data.data
}

export async function deactivateCategory(id) {
  const data = await apiFetch(`/categories/${id}/deactivate`, { method: 'PATCH' })
  if (!data.success) throw new Error(data.error || 'Failed to deactivate category')
  return data.data
}
