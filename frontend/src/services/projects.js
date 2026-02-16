/**
 * Projects Service
 */

import { apiFetch } from './apiFetch'

export async function listProjects(status) {
  const params = status ? `?status=${status}` : ''
  const data = await apiFetch(`/projects${params}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch projects')
  return data.data
}

export async function getProject(id) {
  const data = await apiFetch(`/projects/${id}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch project')
  return data.data
}

export async function createProject(body) {
  const data = await apiFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create project')
  return data.data
}

export async function updateProject(id, body) {
  const data = await apiFetch(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update project')
  return data.data
}

export async function getProjectTasks(id) {
  const data = await apiFetch(`/projects/${id}/tasks`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch project tasks')
  return data.data
}
