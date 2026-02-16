/**
 * Tasks Service
 *
 * All task CRUD, status transitions, claims, and related queries.
 */

import { apiFetch } from './apiFetch'

export async function listTasks(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  const data = await apiFetch(`/tasks${params ? `?${params}` : ''}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch tasks')
  return data.data
}

export async function getTask(id) {
  const data = await apiFetch(`/tasks/${id}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch task')
  return data.data
}

export async function createTask(body) {
  const data = await apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create task')
  return data.data
}

export async function updateTask(id, body) {
  const data = await apiFetch(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update task')
  return data.data
}

export async function deleteTask(id) {
  const data = await apiFetch(`/tasks/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete task')
  return data.data
}

export async function updateTaskStatus(id, status, extra = {}) {
  const body = { status, ...extra }
  const data = await apiFetch(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update status')
  return data.data
}

export async function claimTask(taskId) {
  const data = await apiFetch(`/tasks/${taskId}/claim`, { method: 'POST' })
  if (!data.success) throw new Error(data.error || 'Failed to claim task')
  return data.data
}

export async function passTask(taskId) {
  const data = await apiFetch(`/tasks/${taskId}/pass`, { method: 'POST' })
  if (!data.success) throw new Error(data.error || 'Failed to pass task')
  return data.data
}

export async function getTaskHistory(taskId) {
  const data = await apiFetch(`/task-history?task_id=${taskId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch task history')
  return data.data
}

export async function analyseBrief(taskId) {
  const data = await apiFetch(`/ai/analyse-brief/${taskId}`, { method: 'POST' })
  if (!data.success) throw new Error(data.error || 'Failed to analyse brief')
  return data.data
}

export async function getCampfireTasks() {
  const data = await apiFetch('/tasks/campfire')
  if (!data.success) throw new Error(data.error || 'Failed to fetch campfire tasks')
  return data.data
}

export async function searchAll(query) {
  const data = await apiFetch(`/search?q=${encodeURIComponent(query)}`)
  if (!data.success) throw new Error(data.error || 'Search failed')
  return data.data
}
