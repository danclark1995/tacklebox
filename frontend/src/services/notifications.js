/**
 * Notifications Service
 *
 * In-app notification listing, read status, and deletion.
 */

import { apiFetch } from './apiFetch'

export async function listNotifications(limit = 20, unreadOnly = false) {
  const params = [`limit=${limit}`]
  if (unreadOnly) params.push('unread=true')
  const data = await apiFetch(`/notifications?${params.join('&')}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch notifications')
  return data.data
}

export async function markRead(id) {
  const data = await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
  if (!data.success) throw new Error(data.error || 'Failed to mark notification read')
  return data.data
}

export async function markAllRead() {
  const data = await apiFetch('/notifications/read-all', { method: 'PATCH' })
  if (!data.success) throw new Error(data.error || 'Failed to mark all read')
  return data.data
}

export async function deleteNotification(id) {
  const data = await apiFetch(`/notifications/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete notification')
  return data.data
}
