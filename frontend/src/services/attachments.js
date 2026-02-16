/**
 * Attachments Service
 */

import { apiFetch } from './apiFetch'

export async function listAttachments(taskId) {
  const data = await apiFetch(`/attachments?task_id=${taskId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch attachments')
  return data.data
}

export async function uploadAttachment(formData) {
  const data = await apiFetch('/attachments', {
    method: 'POST',
    body: formData,
  })
  if (!data.success) throw new Error(data.error || 'Failed to upload attachment')
  return data.data
}

export async function deleteAttachment(id) {
  const data = await apiFetch(`/attachments/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete attachment')
  return data.data
}
