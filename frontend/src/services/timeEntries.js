/**
 * Time Entries Service
 */

import { apiFetch } from './apiFetch'

export async function listEntries(taskId) {
  const data = await apiFetch(`/time-entries?task_id=${taskId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch time entries')
  return data.data
}

export async function createEntry(body) {
  const data = await apiFetch('/time-entries', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create time entry')
  return data.data
}

export async function updateEntry(id, body) {
  const data = await apiFetch(`/time-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update time entry')
  return data.data
}

export async function deleteEntry(id) {
  const data = await apiFetch(`/time-entries/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete time entry')
  return data.data
}

export async function getTotal(taskId) {
  const data = await apiFetch(`/time-entries/total?task_id=${taskId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch total')
  return data.data
}
