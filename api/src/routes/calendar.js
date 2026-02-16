/**
 * Calendar Events Routes
 * GET    /calendar          — combined view (task_schedule + calendar_events)
 * POST   /calendar/events   — create personal block or appointment
 * PUT    /calendar/events/:id — update event
 * DELETE /calendar/events/:id — delete event
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'

const VALID_COLORS = ['slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink']

export async function handleCalendar(request, env, auth, path, method) {

  // ── GET /calendar — combined schedule + events ──────────────────
  if (path === '/calendar' && method === 'GET') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const url = new URL(request.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')
    const userId = auth.user.level >= 7
      ? (url.searchParams.get('user_id') || auth.user.id)
      : auth.user.id

    try {
      // Fetch task schedule blocks
      let taskQuery = `
        SELECT s.id, s.task_id, s.start_time, s.end_time, s.status, s.notes,
          'task' as event_type, t.title, t.priority, t.estimated_hours, t.total_payout,
          t.complexity_level, t.deadline,
          cat.name as category_name, c.display_name as client_name,
          NULL as color, NULL as location, NULL as meeting_link, NULL as attendees,
          NULL as related_task_id, NULL as recurrence, NULL as description, 0 as all_day
        FROM task_schedule s
        JOIN tasks t ON s.task_id = t.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN users c ON t.client_id = c.id
        WHERE s.user_id = ?
      `
      const taskBindings = [userId]

      if (start) { taskQuery += ' AND s.end_time >= ?'; taskBindings.push(start) }
      if (end) { taskQuery += ' AND s.start_time <= ?'; taskBindings.push(end) }

      // Fetch calendar events (personal blocks + appointments)
      let eventQuery = `
        SELECT e.id, NULL as task_id, e.start_time, e.end_time, 'scheduled' as status, e.description as notes,
          e.event_type, e.title, NULL as priority, NULL as estimated_hours, NULL as total_payout,
          NULL as complexity_level, NULL as deadline,
          NULL as category_name, NULL as client_name,
          e.color, e.location, e.meeting_link, e.attendees,
          e.related_task_id, e.recurrence, e.description, e.all_day
        FROM calendar_events e
        WHERE e.user_id = ?
      `
      const eventBindings = [userId]

      if (start) { eventQuery += ' AND e.end_time >= ?'; eventBindings.push(start) }
      if (end) { eventQuery += ' AND e.start_time <= ?'; eventBindings.push(end) }

      const [taskResult, eventResult] = await Promise.all([
        env.DB.prepare(taskQuery + ' ORDER BY s.start_time ASC').bind(...taskBindings).all(),
        env.DB.prepare(eventQuery + ' ORDER BY e.start_time ASC').bind(...eventBindings).all(),
      ])

      const taskBlocks = (taskResult.results || []).map(r => ({ ...r, event_type: 'task' }))
      const calEvents = eventResult.results || []

      // Handle recurring events - expand into instances
      const expanded = []
      if (start && end) {
        const rangeStart = new Date(start)
        const rangeEnd = new Date(end)

        for (const evt of calEvents) {
          if (!evt.recurrence) {
            expanded.push(evt)
            continue
          }

          const origStart = new Date(evt.start_time)
          const origEnd = new Date(evt.end_time)
          const duration = origEnd - origStart
          const recEnd = evt.recurrence_end ? new Date(evt.recurrence_end) : rangeEnd

          let current = new Date(origStart)
          while (current <= rangeEnd && current <= recEnd) {
            const instanceEnd = new Date(current.getTime() + duration)
            if (instanceEnd >= rangeStart) {
              const dayOfWeek = current.getDay()
              const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

              if (evt.recurrence === 'daily' ||
                  (evt.recurrence === 'weekdays' && isWeekday) ||
                  (evt.recurrence === 'weekly' && dayOfWeek === origStart.getDay())) {
                expanded.push({
                  ...evt,
                  start_time: current.toISOString(),
                  end_time: instanceEnd.toISOString(),
                  _recurring_parent_id: evt.id,
                })
              }
            }

            // Advance
            if (evt.recurrence === 'weekly') {
              current = new Date(current.getTime() + 7 * 86400000)
            } else {
              current = new Date(current.getTime() + 86400000)
            }
          }
        }
      } else {
        expanded.push(...calEvents)
      }

      const combined = [...taskBlocks, ...expanded].sort(
        (a, b) => new Date(a.start_time) - new Date(b.start_time)
      )

      return jsonResponse({ success: true, data: combined })
    } catch (err) {
      console.error('Calendar fetch error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch calendar' }, 500)
    }
  }

  // ── POST /calendar/events — create personal block or appointment ──
  if (path === '/calendar/events' && method === 'POST') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    try {
      const body = await request.json()
      const { event_type, title, start_time, end_time, description, color, location,
              meeting_link, attendees, related_task_id, recurrence, recurrence_end, all_day } = body

      if (!event_type || !title || !start_time || !end_time) {
        return jsonResponse({ success: false, error: 'event_type, title, start_time, end_time required' }, 400)
      }

      if (!['personal', 'appointment'].includes(event_type)) {
        return jsonResponse({ success: false, error: 'event_type must be personal or appointment' }, 400)
      }

      const eventColor = VALID_COLORS.includes(color) ? color : 'slate'

      const id = crypto.randomUUID()
      await env.DB.prepare(`
        INSERT INTO calendar_events
          (id, user_id, event_type, title, description, start_time, end_time, all_day, color,
           location, meeting_link, attendees, related_task_id, recurrence, recurrence_end)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, auth.user.id, event_type, title, description || null,
        start_time, end_time, all_day ? 1 : 0, eventColor,
        location || null, meeting_link || null, attendees || null,
        related_task_id || null, recurrence || null, recurrence_end || null
      ).run()

      return jsonResponse({ success: true, data: { id } })
    } catch (err) {
      console.error('Create calendar event error:', err)
      return jsonResponse({ success: false, error: 'Failed to create event' }, 500)
    }
  }

  // ── PUT /calendar/events/:id — update ────────────────────────────
  const updateMatch = path.match(/^\/calendar\/events\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const eventId = updateMatch[1]
    try {
      const existing = await env.DB.prepare(
        'SELECT * FROM calendar_events WHERE id = ?'
      ).bind(eventId).first()
      if (!existing) return jsonResponse({ success: false, error: 'Event not found' }, 404)
      if (existing.user_id !== auth.user.id && (auth.user.level || 0) < 7) {
        return jsonResponse({ success: false, error: 'Access denied' }, 403)
      }

      const body = await request.json()
      const updates = []
      const bindings = []
      const fields = ['title', 'description', 'start_time', 'end_time', 'color',
                       'location', 'meeting_link', 'attendees', 'related_task_id',
                       'recurrence', 'recurrence_end']

      for (const f of fields) {
        if (body[f] !== undefined) {
          updates.push(`${f} = ?`)
          bindings.push(body[f])
        }
      }
      if (body.all_day !== undefined) {
        updates.push('all_day = ?')
        bindings.push(body.all_day ? 1 : 0)
      }

      if (updates.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400)
      }

      updates.push('updated_at = datetime("now")')
      bindings.push(eventId)

      await env.DB.prepare(
        `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...bindings).run()

      return jsonResponse({ success: true, data: { id: eventId } })
    } catch (err) {
      console.error('Update calendar event error:', err)
      return jsonResponse({ success: false, error: 'Failed to update event' }, 500)
    }
  }

  // ── DELETE /calendar/events/:id ──────────────────────────────────
  const deleteMatch = path.match(/^\/calendar\/events\/([^\/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const eventId = deleteMatch[1]
    try {
      const existing = await env.DB.prepare(
        'SELECT * FROM calendar_events WHERE id = ?'
      ).bind(eventId).first()
      if (!existing) return jsonResponse({ success: false, error: 'Event not found' }, 404)
      if (existing.user_id !== auth.user.id && (auth.user.level || 0) < 7) {
        return jsonResponse({ success: false, error: 'Access denied' }, 403)
      }

      await env.DB.prepare('DELETE FROM calendar_events WHERE id = ?').bind(eventId).run()
      return jsonResponse({ success: true, data: { deleted: true } })
    } catch (err) {
      console.error('Delete calendar event error:', err)
      return jsonResponse({ success: false, error: 'Failed to delete event' }, 500)
    }
  }

  return null // Not handled by this router
}
