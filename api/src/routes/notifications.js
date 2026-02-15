/**
 * Notification Routes
 * GET /notifications - list notifications for current user
 * PATCH /notifications/:id/read - mark single notification as read
 * PATCH /notifications/read-all - mark all as read
 * DELETE /notifications/:id - delete notification
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'

/**
 * Helper: create a notification (call from other routes)
 * @param {D1Database} db
 * @param {string} userId - recipient
 * @param {string} type - task_assigned|task_status|comment|bonus|deadline|credits_low|system
 * @param {string} title
 * @param {string} message
 * @param {string} link - optional navigation path
 */
export async function createNotification(db, userId, type, title, message, link = null) {
  try {
    const id = crypto.randomUUID()
    await db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, userId, type, title, message, link).run()
    return id
  } catch (err) {
    console.error('Failed to create notification:', err)
    return null
  }
}

export async function handleNotifications(request, env, auth, path, method) {
  // GET /notifications - list for current user
  if (path === '/notifications' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const url = new URL(request.url)
      const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100)
      const unreadOnly = url.searchParams.get('unread') === 'true'

      let query = 'SELECT * FROM notifications WHERE user_id = ?'
      const bindings = [auth.user.id]

      if (unreadOnly) {
        query += ' AND is_read = 0'
      }

      query += ' ORDER BY created_at DESC LIMIT ?'
      bindings.push(limit)

      const result = await env.DB.prepare(query).bind(...bindings).all()

      // Get unread count
      const countResult = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
      ).bind(auth.user.id).first()

      return jsonResponse({
        success: true,
        data: {
          notifications: result.results || [],
          unread_count: countResult?.count || 0,
        },
      })
    } catch (err) {
      console.error('Get notifications error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch notifications' }, 500)
    }
  }

  // PATCH /notifications/read-all - mark all as read
  if (path === '/notifications/read-all' && method === 'PATCH') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      await env.DB.prepare(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
      ).bind(auth.user.id).run()

      return jsonResponse({ success: true })
    } catch (err) {
      console.error('Mark all read error:', err)
      return jsonResponse({ success: false, error: 'Failed to mark notifications as read' }, 500)
    }
  }

  // PATCH /notifications/:id/read - mark single as read
  const readMatch = path.match(/^\/notifications\/([^\/]+)\/read$/)
  if (readMatch && method === 'PATCH') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const notifId = readMatch[1]
      await env.DB.prepare(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
      ).bind(notifId, auth.user.id).run()

      return jsonResponse({ success: true })
    } catch (err) {
      console.error('Mark read error:', err)
      return jsonResponse({ success: false, error: 'Failed to mark notification as read' }, 500)
    }
  }

  // DELETE /notifications/:id
  const deleteMatch = path.match(/^\/notifications\/([^\/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const notifId = deleteMatch[1]
      await env.DB.prepare(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?'
      ).bind(notifId, auth.user.id).run()

      return jsonResponse({ success: true })
    } catch (err) {
      console.error('Delete notification error:', err)
      return jsonResponse({ success: false, error: 'Failed to delete notification' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
