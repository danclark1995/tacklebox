/**
 * Comment Routes
 * GET /comments?task_id= - list comments for a task
 * POST /comments - create comment
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'
import { notifyNewComment, notifyMention } from '../services/notifications.js'

export async function handleComments(request, env, auth, path, method) {
  // GET /comments?task_id= - list comments for a task
  if (path === '/comments' && method === 'GET') {
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

      // Check access
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

      // Build query based on role
      let query = `
        SELECT c.*,
          u.display_name as user_name,
          u.role as user_role,
          u.avatar_url as user_avatar
        FROM task_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.task_id = ?
      `
      const bindings = [taskId]

      // Filter visibility based on role
      if (auth.user.role === 'client') {
        // Clients can't see internal comments
        query += ' AND c.visibility = "all"'
      }
      // Admin and contractors see all comments (including internal)

      query += ' ORDER BY c.created_at ASC'

      const result = await env.DB.prepare(query).bind(...bindings).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('List comments error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch comments' },
        500
      )
    }
  }

  // POST /comments - create comment
  if (path === '/comments' && method === 'POST') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const body = await request.json()
      const { task_id, content, visibility } = body

      if (!task_id || !content) {
        return jsonResponse(
          { success: false, error: 'task_id and content are required' },
          400
        )
      }

      // Validate visibility
      const finalVisibility = visibility || 'all'
      if (!['all', 'internal'].includes(finalVisibility)) {
        return jsonResponse(
          { success: false, error: 'Invalid visibility value' },
          400
        )
      }

      // Clients can only post 'all' visibility
      if (auth.user.role === 'client' && finalVisibility === 'internal') {
        return jsonResponse(
          { success: false, error: 'Clients cannot post internal comments' },
          403
        )
      }

      // Verify task exists and user has access
      const task = await env.DB.prepare(
        'SELECT id, title, client_id, contractor_id FROM tasks WHERE id = ?'
      ).bind(task_id).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      // Check permissions
      let hasAccess = false
      if (auth.user.role === 'admin') {
        hasAccess = true
      } else if (auth.user.role === 'client' && task.client_id === auth.user.id) {
        hasAccess = true
      } else if (auth.user.role === 'contractor' && task.contractor_id === auth.user.id) {
        hasAccess = true
      }

      if (!hasAccess) {
        return jsonResponse(
          { success: false, error: 'You do not have permission to comment on this task' },
          403
        )
      }

      const commentId = crypto.randomUUID()

      await env.DB.prepare(`
        INSERT INTO task_comments (id, task_id, user_id, content, visibility)
        VALUES (?, ?, ?, ?, ?)
      `).bind(commentId, task_id, auth.user.id, content, finalVisibility).run()

      const newComment = await env.DB.prepare(`
        SELECT c.*,
          u.display_name as user_name,
          u.role as user_role,
          u.avatar_url as user_avatar
        FROM task_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `).bind(commentId).first()

      // Notify other task participants (non-blocking)
      try {
        const participants = await env.DB.prepare(`
          SELECT DISTINCT u.id, u.email, u.display_name
          FROM users u
          WHERE (u.id IN (?, ?) OR u.role = 'admin') AND u.id != ? AND u.is_active = 1
        `).bind(task.client_id, task.contractor_id || '', auth.user.id).all()
        const recipients = (participants.results || []).filter(p => p.email)
        if (recipients.length > 0) {
          notifyNewComment(task, newComment, recipients)
        }
      } catch (e) { /* notification errors are non-critical */ }

      // Parse @mentions and send notifications
      // TODO: Send real email/push notification for @mentions when email service is configured
      try {
        const mentions = content.match(/@([A-Za-z]+(?:\s[A-Za-z]+)*)/g)
        if (mentions && mentions.length > 0) {
          const mentionNames = mentions.map(m => m.substring(1))
          const placeholders = mentionNames.map(() => '?').join(',')
          const mentionedUsers = await env.DB.prepare(
            `SELECT id, email, display_name FROM users WHERE display_name IN (${placeholders})`
          ).bind(...mentionNames).all()
          if (mentionedUsers.results?.length > 0) {
            for (const mentioned of mentionedUsers.results) {
              notifyMention(task, mentioned, auth.user, content)
            }
          }
        }
      } catch (e) { /* mention notification errors are non-critical */ }

      return jsonResponse(
        {
          success: true,
          data: newComment,
        },
        201
      )
    } catch (err) {
      console.error('Create comment error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to create comment' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
