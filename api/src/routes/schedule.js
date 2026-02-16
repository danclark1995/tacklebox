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

const HOURS = Array.from({ length: 24 }, (_, i) => i)

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

  // ── GET /schedule/suggestions/:taskId — pattern-based smart scheduling ──
  const suggestMatch = path.match(/^\/schedule\/suggestions\/([^\/]+)$/)
  if (suggestMatch && method === 'GET') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const taskId = suggestMatch[1]
    try {
      const task = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first()
      if (!task) return jsonResponse({ success: false, error: 'Task not found' }, 404)

      const userId = auth.user.level >= 7 ? (task.contractor_id || auth.user.id) : auth.user.id
      const hours = task.estimated_hours || 2
      const blockMinutes = Math.ceil(hours * 60)
      const now = new Date()
      const lookAhead = new Date(now.getTime() + 14 * 86400000)

      // ─── 1. Analyze user's historical patterns ───
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
      const [historyResult, personalResult, upcomingResult] = await Promise.all([
        env.DB.prepare(`
          SELECT start_time, end_time FROM task_schedule
          WHERE user_id = ? AND start_time >= ? AND status IN ('scheduled', 'in_progress', 'completed')
          ORDER BY start_time ASC
        `).bind(userId, thirtyDaysAgo.toISOString()).all(),
        env.DB.prepare(`
          SELECT start_time, end_time, recurrence FROM calendar_events
          WHERE user_id = ? AND event_type = 'personal'
          AND (end_time >= ? OR recurrence IS NOT NULL)
        `).bind(userId, now.toISOString()).all(),
        env.DB.prepare(`
          SELECT start_time, end_time FROM task_schedule
          WHERE user_id = ? AND end_time >= ? AND start_time <= ?
          AND status IN ('scheduled', 'in_progress')
        `).bind(userId, now.toISOString(), lookAhead.toISOString()).all(),
      ])

      const history = historyResult.results || []
      const personalBlocks = personalResult.results || []
      const upcoming = upcomingResult.results || []

      // Build hour-frequency map from history
      const hourScores = new Array(24).fill(0)
      for (const block of history) {
        const start = new Date(block.start_time)
        const end = new Date(block.end_time)
        for (let h = start.getHours(); h <= Math.min(end.getHours(), 23); h++) {
          hourScores[h]++
        }
      }

      // Build personal-block hour map
      const personalHours = new Array(24).fill(0)
      for (const block of personalBlocks) {
        const start = new Date(block.start_time)
        const end = new Date(block.end_time)
        for (let h = start.getHours(); h <= Math.min(end.getHours(), 23); h++) {
          personalHours[h]++
        }
      }

      // Determine preferred window
      let preferredHours
      const totalActivity = hourScores.reduce((a, b) => a + b, 0)
      if (totalActivity < 3) {
        preferredHours = HOURS.filter(h => h >= 7 && h < 21)
      } else {
        const avgScore = totalActivity / 24
        preferredHours = HOURS
          .filter(h => hourScores[h] > avgScore * 0.5 && personalHours[h] === 0)
          .sort((a, b) => hourScores[b] - hourScores[a])
        if (preferredHours.length < 6) {
          preferredHours = HOURS.filter(h => h >= 6 && h < 23 && personalHours[h] === 0)
        }
      }
      preferredHours.sort((a, b) => a - b)

      // ─── 2. Expand personal recurring blocks into 14-day window ───
      const personalSlots = []
      for (const block of personalBlocks) {
        if (!block.recurrence) {
          personalSlots.push({ start: new Date(block.start_time), end: new Date(block.end_time) })
          continue
        }
        const origStart = new Date(block.start_time)
        const origEnd = new Date(block.end_time)
        const duration = origEnd - origStart
        let current = new Date(origStart)
        while (current <= lookAhead) {
          if (current >= now) {
            const dayOfWeek = current.getDay()
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
            if (block.recurrence === 'daily' ||
                (block.recurrence === 'weekdays' && isWeekday) ||
                (block.recurrence === 'weekly' && dayOfWeek === origStart.getDay())) {
              personalSlots.push({ start: new Date(current), end: new Date(current.getTime() + duration) })
            }
          }
          current = new Date(current.getTime() + (block.recurrence === 'weekly' ? 7 * 86400000 : 86400000))
        }
      }

      // ─── 3. Find suggestion slots ───
      const allBusySlots = [
        ...upcoming.map(b => ({ start: new Date(b.start_time).getTime(), end: new Date(b.end_time).getTime() })),
        ...personalSlots.map(b => ({ start: b.start.getTime(), end: b.end.getTime() })),
      ]

      const hasConflict = (slotStart, slotEnd) => {
        return allBusySlots.some(b => slotStart < b.end && slotEnd > b.start)
      }

      const suggestions = []

      for (let dayOffset = 0; dayOffset < 14 && suggestions.length < 3; dayOffset++) {
        const day = new Date(now)
        day.setDate(day.getDate() + dayOffset)

        for (const startHour of preferredHours) {
          if (suggestions.length >= 3) break

          const slotStart = new Date(day)
          slotStart.setHours(startHour, 0, 0, 0)

          if (slotStart.getTime() < now.getTime()) {
            slotStart.setTime(now.getTime())
            const m = slotStart.getMinutes()
            if (m > 0 && m <= 30) slotStart.setMinutes(30, 0, 0)
            else if (m > 30) { slotStart.setHours(slotStart.getHours() + 1, 0, 0, 0) }
            if (slotStart.getHours() !== startHour) continue
          }

          const slotEnd = new Date(slotStart.getTime() + blockMinutes * 60000)

          if (!hasConflict(slotStart.getTime(), slotEnd.getTime())) {
            let fit = 'good'
            const slotHour = slotStart.getHours()
            const patternScore = hourScores[slotHour] || 0
            const maxScore = Math.max(...hourScores, 1)

            if (task.deadline) {
              const deadline = new Date(task.deadline)
              const daysToDeadline = (deadline - slotStart) / 86400000
              if (daysToDeadline < 1) fit = 'urgent'
              else if (daysToDeadline < 3) fit = 'soon'
            }

            let context = ''
            if (totalActivity >= 3 && patternScore >= maxScore * 0.6) {
              context = 'Your peak time'
            } else if (totalActivity >= 3 && patternScore > 0) {
              context = 'Active hours'
            }

            suggestions.push({
              start_time: slotStart.toISOString(),
              end_time: slotEnd.toISOString(),
              fit,
              context,
              pattern_score: totalActivity >= 3 ? Math.round((patternScore / maxScore) * 100) : null,
              day_label: dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : day.toLocaleDateString('en-NZ', { weekday: 'long' }),
              time_label: `${slotStart.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })} – ${slotEnd.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`,
            })
          }
        }
      }

      return jsonResponse({
        success: true,
        data: {
          task: { id: task.id, title: task.title, estimated_hours: hours, deadline: task.deadline, priority: task.priority },
          suggestions,
          patterns: totalActivity >= 3 ? {
            preferred_hours: preferredHours.slice(0, 6).map(h => formatHourLabel(h)),
            blocked_hours: HOURS.filter(h => personalHours[h] > 0).map(h => formatHourLabel(h)),
            total_blocks_analyzed: history.length,
          } : null,
        }
      })
    } catch (err) {
      console.error('Schedule suggestions error:', err)
      return jsonResponse({ success: false, error: 'Failed to generate suggestions' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}

function formatHourLabel(h) {
  if (h === 0 || h === 24) return '12am'
  if (h === 12) return '12pm'
  return h > 12 ? `${h - 12}pm` : `${h}am`
}
