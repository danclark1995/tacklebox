/**
 * Comments Service
 */

import { apiFetch } from './apiFetch'

export async function listComments(taskId) {
  const data = await apiFetch(`/comments?task_id=${taskId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch comments')
  return data.data
}

export async function createComment(body) {
  const data = await apiFetch('/comments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create comment')
  return data.data
}

export async function deleteComment(id) {
  const data = await apiFetch(`/comments/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete comment')
  return data.data
}
