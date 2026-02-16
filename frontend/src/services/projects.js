/**
 * Projects Service
 */

import { apiFetch } from './apiFetch'

export async function listProjects() {
  const data = await apiFetch('/projects')
  if (!data.success) throw new Error(data.error || 'Failed to fetch projects')
  return data.data
}
