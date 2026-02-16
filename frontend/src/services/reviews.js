/**
 * Reviews Service
 */

import { apiFetch } from './apiFetch'

export async function listReviews(taskId) {
  const data = await apiFetch(`/reviews?task_id=${taskId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch reviews')
  return data.data
}

export async function createReview(body) {
  const data = await apiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create review')
  return data.data
}
