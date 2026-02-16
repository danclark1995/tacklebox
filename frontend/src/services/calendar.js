/**
 * Calendar Service
 *
 * Combined calendar data: task blocks, personal blocks, appointments.
 * Uses /calendar endpoint for combined data.
 * Uses /calendar/events for personal/appointment CRUD.
 * Uses /schedule for task block CRUD (unchanged).
 */

import { apiFetch } from './apiFetch'

// Combined calendar data
export async function getCalendarData(start, end) {
  const data = await apiFetch(`/calendar?start=${start}&end=${end}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch calendar')
  return data.data
}

// Calendar events (personal + appointment) CRUD
export async function createCalendarEvent(body) {
  const data = await apiFetch('/calendar/events', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create event')
  return data.data
}

export async function updateCalendarEvent(id, body) {
  const data = await apiFetch(`/calendar/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update event')
  return data.data
}

export async function deleteCalendarEvent(id) {
  const data = await apiFetch(`/calendar/events/${id}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete event')
  return data.data
}
