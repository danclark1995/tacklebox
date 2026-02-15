/**
 * Schedule Routes — Calendar / task scheduling
 * GET /schedule — get user's scheduled blocks
 * POST /schedule — create a schedule block
 * PUT /schedule/:id — update a schedule block
 * DELETE /schedule/:id — remove a schedule block
 * GET /schedule/suggestions/:taskId — AI-like scheduling suggestions
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'

export async function handleSchedule(request, env, auth, path, method) {

  // ── GET /schedule — user's schedule ──────────────────────────────
  if (path === '/schedule' && method === 'GET') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const url = new URL(request.url)
    const start = url.searchParams.get('start') // ISO date
    const end = url.searchParams.get('end')     // ISO date
    const userId = auth.user.role === 'admin' 
      ? (url.searchParams.get('user_id') || auth.user.id) 
      : auth.user.id

    try {
      let query = `
        SELECT s.*, t.title as task_title, t.priority, t.estimated_hours, t.total_payout,
          t.complexity_level, t.min_level, t.deadline,
          cat.name as category_name,
          c.display_name as client_name
        FROM task_schedule s
        JOIN tasks t ON s.task_id = t.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN users c ON t.client_id = c.id
        WHERE s.user_id = ?
      `
      const bindings = [userId]

      if (start) {
        query += ' AND s.end_time >= ?'
        bindings.push(start)
      }
      if (end) {
        query += ' AND s.start_time <= ?'
        bindings.push(end)
      }

      query += ' ORDER BY s.start_time ASC'

      const stmt = env.DB.prepare(query)
      const result = await stmt.bind(...bindings).all()

      return jsonResponse({ success: true, data: result.results || [] })
    } catch (err) {
      console.error('Get schedule error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch schedule' }, 500)
    }
  }

  // ── POST /schedule — create schedule block ───────────────────────
  if (path === '/schedule' && method === 'POST') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    try {
      const body = await request.json()
      const { task_id, start_time, end_time, notes } = body

      if (!task_id || !start_time || !end_time) {
        return jsonResponse({ success: false, error: 'task_id, start_time, end_time required' }, 400)
      }

      // Verify task exists and user is assigned
      const task = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(task_id).first()
      if (!task) return jsonResponse({ success: false, error: 'Task not found' }, 404)

      if (auth.user.role === 'contractor' && task.contractor_id !== auth.user.id) {
        return jsonResponse({ success: false, error: 'You are not assigned to this task' }, 403)
      }

      const userId = auth.user.role === 'admin' ? (task.contractor_id || auth.user.id) : auth.user.id

      // Check for overlapping blocks
      const overlap = await env.DB.prepare(`
        SELECT id FROM task_schedule 
        WHERE user_id = ? AND start_time < ? AND end_time > ?
        AND status IN ('scheduled', 'in_progress')
        LIMIT 1
      `).bind(userId, end_time, start_time).first()

      const blockId = crypto.randomUUID()
      await env.DB.prepare(`
        INSERT INTO task_schedule (id, task_id, user_id, start_time, end_time, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(blockId, task_id, userId, start_time, end_time, notes || null).run()

      return jsonResponse({
        success: true,
        data: { id: blockId, has_overlap: !!overlap }
      })
    } catch (err) {
      console.error('Create schedule block error:', err)
      return jsonResponse({ success: false, error: 'Failed to create schedule block' }, 500)
    }
  }

  // ── PUT /schedule/:id — update block ─────────────────────────────
  const updateMatch = path.match(/^\/schedule\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const blockId = updateMatch[1]
    try {
      const block = await env.DB.prepare(
        'SELECT * FROM task_schedule WHERE id = ?'
      ).bind(blockId).first()
      if (!block) return jsonResponse({ success: false, error: 'Block not found' }, 404)

      if (auth.user.role === 'contractor' && block.user_id !== auth.user.id) {
        return jsonResponse({ success: false, error: 'Access denied' }, 403)
      }

      const body = await request.json()
      const updates = []
      const bindings = []

      if (body.start_time) { updates.push('start_time = ?'); bindings.push(body.start_time) }
      if (body.end_time) { updates.push('end_time = ?'); bindings.push(body.end_time) }
      if (body.status) { updates.push('status = ?'); bindings.push(body.status) }
      if (body.notes !== undefined) { updates.push('notes = ?'); bindings.push(body.notes) }

      if (updates.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400)
      }

      updates.push('updated_at = datetime("now")')
      bindings.push(blockId)

      await env.DB.prepare(
        `UPDATE task_schedule SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...bindings).run()

      return jsonResponse({ success: true, data: { id: blockId } })
    } catch (err) {
      console.error('Update schedule block error:', err)
      return jsonResponse({ success: false, error: 'Failed to update block' }, 500)
    }
  }

  // ── DELETE /schedule/:id ─────────────────────────────────────────
  const deleteMatch = path.match(/^\/schedule\/([^\/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const blockId = deleteMatch[1]
    try {
      const block = await env.DB.prepare(
        'SELECT * FROM task_schedule WHERE id = ?'
      ).bind(blockId).first()
      if (!block) return jsonResponse({ success: false, error: 'Block not found' }, 404)

      if (auth.user.role === 'contractor' && block.user_id !== auth.user.id) {
        return jsonResponse({ success: false, error: 'Access denied' }, 403)
      }

      await env.DB.prepare('DELETE FROM task_schedule WHERE id = ?').bind(blockId).run()
      return jsonResponse({ success: true, data: { deleted: true } })
    } catch (err) {
      console.error('Delete schedule block error:', err)
      return jsonResponse({ success: false, error: 'Failed to delete block' }, 500)
    }
  }

  // ── GET /schedule/suggestions/:taskId — smart scheduling ─────────
  const suggestMatch = path.match(/^\/schedule\/suggestions\/([^\/]+)$/)
  if (suggestMatch && method === 'GET') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const taskId = suggestMatch[1]
    try {
      const task = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first()
      if (!task) return jsonResponse({ success: false, error: 'Task not found' }, 404)

      const userId = auth.user.role === 'admin' ? (task.contractor_id || auth.user.id) : auth.user.id
      const hours = task.estimated_hours || 2

      // Get existing schedule for the next 7 days
      const now = new Date()
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const existing = await env.DB.prepare(`
        SELECT start_time, end_time FROM task_schedule
        WHERE user_id = ? AND end_time >= ? AND start_time <= ?
        AND status IN ('scheduled', 'in_progress')
        ORDER BY start_time ASC
      `).bind(userId, now.toISOString(), weekEnd.toISOString()).all()

      const blocks = existing.results || []

      // Generate suggestion slots (9am-5pm work hours, avoiding conflicts)
      const suggestions = []
      const blockMinutes = Math.ceil(hours * 60)

      for (let dayOffset = 0; dayOffset < 7 && suggestions.length < 3; dayOffset++) {
        const day = new Date(now)
        day.setDate(day.getDate() + dayOffset)
        
        // Skip weekends
        if (day.getDay() === 0 || day.getDay() === 6) continue

        // Work hours: 9am to 5pm
        const dayStart = new Date(day)
        dayStart.setHours(9, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(17, 0, 0, 0)

        // If today, start from now (rounded up to next 30 min)
        let slotStart = dayOffset === 0 ? new Date(Math.max(now.getTime(), dayStart.getTime())) : dayStart
        if (slotStart < dayStart) slotStart = dayStart

        // Round to next 30 min
        const mins = slotStart.getMinutes()
        if (mins > 0 && mins <= 30) slotStart.setMinutes(30, 0, 0)
        else if (mins > 30) { slotStart.setHours(slotStart.getHours() + 1, 0, 0, 0) }

        while (slotStart.getTime() + blockMinutes * 60000 <= dayEnd.getTime() && suggestions.length < 3) {
          const slotEnd = new Date(slotStart.getTime() + blockMinutes * 60000)

          // Check for conflicts
          const hasConflict = blocks.some(b => {
            const bStart = new Date(b.start_time).getTime()
            const bEnd = new Date(b.end_time).getTime()
            return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart
          })

          if (!hasConflict) {
            // Determine urgency label
            let fit = 'good'
            if (task.deadline) {
              const deadline = new Date(task.deadline)
              const daysToDeadline = (deadline - slotStart) / (1000 * 60 * 60 * 24)
              if (daysToDeadline < 1) fit = 'urgent'
              else if (daysToDeadline < 3) fit = 'soon'
            }

            suggestions.push({
              start_time: slotStart.toISOString(),
              end_time: slotEnd.toISOString(),
              fit,
              day_label: dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : day.toLocaleDateString('en-NZ', { weekday: 'long' }),
              time_label: `${slotStart.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })} – ${slotEnd.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`,
            })
          }

          // Move to next slot (try after the conflict or next 30 min)
          if (hasConflict) {
            const conflictEnd = blocks
              .filter(b => new Date(b.start_time) < slotEnd && new Date(b.end_time) > slotStart)
              .reduce((max, b) => Math.max(max, new Date(b.end_time).getTime()), 0)
            slotStart = new Date(conflictEnd)
            // Round up to next 30 min
            const m = slotStart.getMinutes()
            if (m > 0 && m <= 30) slotStart.setMinutes(30, 0, 0)
            else if (m > 30) { slotStart.setHours(slotStart.getHours() + 1, 0, 0, 0) }
          } else {
            slotStart = slotEnd
          }
        }
      }

      return jsonResponse({
        success: true,
        data: {
          task: { id: task.id, title: task.title, estimated_hours: hours, deadline: task.deadline, priority: task.priority },
          suggestions,
        }
      })
    } catch (err) {
      console.error('Schedule suggestions error:', err)
      return jsonResponse({ success: false, error: 'Failed to generate suggestions' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
