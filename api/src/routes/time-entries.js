/**
 * Time Entry Routes
 * GET /time-entries?task_id= - list time entries for a task
 * POST /time-entries - create time entry
 * PUT /time-entries/:id - update time entry
 * DELETE /time-entries/:id - delete time entry
 * GET /time-entries/total?task_id= - get total duration for a task
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'

export async function handleTimeEntries(request, env, auth, path, method) {
  // GET /time-entries/total?task_id= - get total duration for a task
  if (path === '/time-entries/total' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const url = new URL(request.url)
      const taskId = url.searchParams.get('task_id')

      if (!taskId) {
        return jsonResponse(
          { success: false, error: 'task_id is required' },
          400
        )
      }

      // Verify task exists and user has access
      const task = await env.DB.prepare(
        'SELECT id, client_id, contractor_id FROM tasks WHERE id = ?'
      ).bind(taskId).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      const hasAccess =
        auth.user.role === 'admin' ||
        task.client_id === auth.user.id ||
        task.contractor_id === auth.user.id

      if (!hasAccess) {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      const result = await env.DB.prepare(
        'SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes FROM time_entries WHERE task_id = ?'
      ).bind(taskId).first()

      return jsonResponse({
        success: true,
        data: { total_minutes: result.total_minutes },
      })
    } catch (err) {
      console.error('Get time total error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch time total' },
        500
      )
    }
  }

  // GET /time-entries?task_id= - list time entries for a task
  if (path === '/time-entries' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const url = new URL(request.url)
      const taskId = url.searchParams.get('task_id')

      if (!taskId) {
        return jsonResponse(
          { success: false, error: 'task_id is required' },
          400
        )
      }

      // Verify task exists and user has access
      const task = await env.DB.prepare(
        'SELECT id, client_id, contractor_id FROM tasks WHERE id = ?'
      ).bind(taskId).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      const hasAccess =
        auth.user.role === 'admin' ||
        task.client_id === auth.user.id ||
        task.contractor_id === auth.user.id

      if (!hasAccess) {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      const result = await env.DB.prepare(`
        SELECT te.*,
          u.display_name as user_name
        FROM time_entries te
        LEFT JOIN users u ON te.user_id = u.id
        WHERE te.task_id = ?
        ORDER BY te.date DESC, te.created_at DESC
      `).bind(taskId).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('List time entries error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch time entries' },
        500
      )
    }
  }

  // POST /time-entries - create time entry
  if (path === '/time-entries' && method === 'POST') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const body = await request.json()
      const { task_id, date, duration_minutes, description } = body

      // Validate required fields
      if (!task_id) {
        return jsonResponse(
          { success: false, error: 'task_id is required' },
          400
        )
      }

      if (!date) {
        return jsonResponse(
          { success: false, error: 'date is required' },
          400
        )
      }

      if (duration_minutes === undefined || duration_minutes === null) {
        return jsonResponse(
          { success: false, error: 'duration_minutes is required' },
          400
        )
      }

      if (!description || description.trim().length < 5) {
        return jsonResponse(
          { success: false, error: 'description is required and must be at least 5 characters' },
          400
        )
      }

      // Validate duration_minutes
      if (!Number.isInteger(duration_minutes) || duration_minutes < 15 || duration_minutes > 480 || duration_minutes % 15 !== 0) {
        return jsonResponse(
          { success: false, error: 'duration_minutes must be an integer, multiple of 15, between 15 and 480' },
          400
        )
      }

      // Verify task exists
      const task = await env.DB.prepare(
        'SELECT id, contractor_id, created_at FROM tasks WHERE id = ?'
      ).bind(task_id).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      // Only assigned contractor or admin can log time
      if (auth.user.role === 'contractor' && task.contractor_id !== auth.user.id) {
        return jsonResponse(
          { success: false, error: 'Only the assigned contractor or admin can log time' },
          403
        )
      }

      if (auth.user.role === 'client') {
        return jsonResponse(
          { success: false, error: 'Clients cannot log time entries' },
          403
        )
      }

      // Validate date is not in the future
      const today = new Date().toISOString().split('T')[0]
      if (date > today) {
        return jsonResponse(
          { success: false, error: 'Date cannot be in the future' },
          400
        )
      }

      // Validate date is not before task creation date
      const taskCreatedDate = task.created_at.split('T')[0]
      if (date < taskCreatedDate) {
        return jsonResponse(
          { success: false, error: 'Date cannot be before task creation date' },
          400
        )
      }

      const entryId = crypto.randomUUID()

      await env.DB.prepare(`
        INSERT INTO time_entries (id, task_id, user_id, date, duration_minutes, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(entryId, task_id, auth.user.id, date, duration_minutes, description.trim()).run()

      const newEntry = await env.DB.prepare(`
        SELECT te.*,
          u.display_name as user_name
        FROM time_entries te
        LEFT JOIN users u ON te.user_id = u.id
        WHERE te.id = ?
      `).bind(entryId).first()

      return jsonResponse(
        {
          success: true,
          data: newEntry,
        },
        201
      )
    } catch (err) {
      console.error('Create time entry error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to create time entry' },
        500
      )
    }
  }

  // PUT /time-entries/:id - update time entry
  const updateMatch = path.match(/^\/time-entries\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const entryId = updateMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // Fetch existing entry
      const entry = await env.DB.prepare(
        'SELECT * FROM time_entries WHERE id = ?'
      ).bind(entryId).first()

      if (!entry) {
        return jsonResponse(
          { success: false, error: 'Time entry not found' },
          404
        )
      }

      // Check permissions
      if (auth.user.role === 'contractor' && entry.user_id !== auth.user.id) {
        return jsonResponse(
          { success: false, error: 'You can only edit your own time entries' },
          403
        )
      }

      if (auth.user.role === 'client') {
        return jsonResponse(
          { success: false, error: 'Clients cannot edit time entries' },
          403
        )
      }

      const body = await request.json()
      const { date, duration_minutes, description } = body

      const updates = []
      const bindings = []

      // Fetch task for validation
      const task = await env.DB.prepare(
        'SELECT id, contractor_id, created_at FROM tasks WHERE id = ?'
      ).bind(entry.task_id).first()

      if (date !== undefined) {
        if (!date) {
          return jsonResponse(
            { success: false, error: 'date cannot be empty' },
            400
          )
        }

        // Validate date is not in the future
        const today = new Date().toISOString().split('T')[0]
        if (date > today) {
          return jsonResponse(
            { success: false, error: 'Date cannot be in the future' },
            400
          )
        }

        // Validate date is not before task creation date
        if (task) {
          const taskCreatedDate = task.created_at.split('T')[0]
          if (date < taskCreatedDate) {
            return jsonResponse(
              { success: false, error: 'Date cannot be before task creation date' },
              400
            )
          }
        }

        updates.push('date = ?')
        bindings.push(date)
      }

      if (duration_minutes !== undefined) {
        if (!Number.isInteger(duration_minutes) || duration_minutes < 15 || duration_minutes > 480 || duration_minutes % 15 !== 0) {
          return jsonResponse(
            { success: false, error: 'duration_minutes must be an integer, multiple of 15, between 15 and 480' },
            400
          )
        }
        updates.push('duration_minutes = ?')
        bindings.push(duration_minutes)
      }

      if (description !== undefined) {
        if (!description || description.trim().length < 5) {
          return jsonResponse(
            { success: false, error: 'description must be at least 5 characters' },
            400
          )
        }
        updates.push('description = ?')
        bindings.push(description.trim())
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: 'No fields to update' },
          400
        )
      }

      updates.push('updated_at = datetime("now")')
      bindings.push(entryId)

      await env.DB.prepare(`
        UPDATE time_entries SET ${updates.join(', ')} WHERE id = ?
      `).bind(...bindings).run()

      const updatedEntry = await env.DB.prepare(`
        SELECT te.*,
          u.display_name as user_name
        FROM time_entries te
        LEFT JOIN users u ON te.user_id = u.id
        WHERE te.id = ?
      `).bind(entryId).first()

      return jsonResponse({
        success: true,
        data: updatedEntry,
      })
    } catch (err) {
      console.error('Update time entry error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to update time entry' },
        500
      )
    }
  }

  // DELETE /time-entries/:id - delete time entry
  const deleteMatch = path.match(/^\/time-entries\/([^\/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    const entryId = deleteMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // Fetch existing entry
      const entry = await env.DB.prepare(
        'SELECT * FROM time_entries WHERE id = ?'
      ).bind(entryId).first()

      if (!entry) {
        return jsonResponse(
          { success: false, error: 'Time entry not found' },
          404
        )
      }

      // Check permissions
      if (auth.user.role === 'contractor' && entry.user_id !== auth.user.id) {
        return jsonResponse(
          { success: false, error: 'You can only delete your own time entries' },
          403
        )
      }

      if (auth.user.role === 'client') {
        return jsonResponse(
          { success: false, error: 'Clients cannot delete time entries' },
          403
        )
      }

      await env.DB.prepare(
        'DELETE FROM time_entries WHERE id = ?'
      ).bind(entryId).run()

      return jsonResponse({
        success: true,
        data: { id: entryId },
      })
    } catch (err) {
      console.error('Delete time entry error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to delete time entry' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
