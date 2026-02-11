/**
 * Support Message Routes
 * POST /support      - client creates support message
 * GET  /support      - admin lists all support messages
 * PUT  /support/:id  - admin updates status
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { notifySupportMessage } from '../services/notifications.js'

export async function handleSupport(request, env, auth, path, method) {
  // POST /support - create support message
  if (path === '/support' && method === 'POST') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const body = await request.json()
      const { subject, message } = body

      if (!subject || !message) {
        return jsonResponse({ success: false, error: 'subject and message are required' }, 400)
      }

      const id = crypto.randomUUID()

      await env.DB.prepare(`
        INSERT INTO support_messages (id, user_id, subject, message)
        VALUES (?, ?, ?, ?)
      `).bind(id, auth.user.id, subject, message).run()

      const created = await env.DB.prepare(
        'SELECT * FROM support_messages WHERE id = ?'
      ).bind(id).first()

      // Notify admins (non-blocking)
      try {
        const admins = await env.DB.prepare(
          'SELECT email FROM users WHERE role = "admin"'
        ).all()
        const adminEmails = (admins.results || []).map(a => a.email).filter(Boolean)
        if (adminEmails.length > 0) {
          notifySupportMessage(created, adminEmails)
        }
      } catch (e) { /* notification errors are non-critical */ }

      return jsonResponse({ success: true, data: created }, 201)
    } catch (err) {
      console.error('Create support message error:', err)
      return jsonResponse({ success: false, error: 'Failed to create support message' }, 500)
    }
  }

  // GET /support - list all support messages (admin only)
  if (path === '/support' && method === 'GET') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const result = await env.DB.prepare(`
        SELECT s.*, u.display_name as user_name, u.email as user_email
        FROM support_messages s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
      `).all()

      return jsonResponse({ success: true, data: result.results || [] })
    } catch (err) {
      console.error('List support messages error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch support messages' }, 500)
    }
  }

  // PUT /support/:id - update status (admin only)
  const updateMatch = path.match(/^\/support\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const messageId = updateMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const body = await request.json()
      const { status } = body

      if (!status || !['open', 'resolved'].includes(status)) {
        return jsonResponse({ success: false, error: 'status must be "open" or "resolved"' }, 400)
      }

      const msg = await env.DB.prepare(
        'SELECT id FROM support_messages WHERE id = ?'
      ).bind(messageId).first()

      if (!msg) {
        return jsonResponse({ success: false, error: 'Support message not found' }, 404)
      }

      const resolvedAt = status === 'resolved' ? new Date().toISOString() : null
      const resolvedBy = status === 'resolved' ? auth.user.id : null

      await env.DB.prepare(`
        UPDATE support_messages SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?
      `).bind(status, resolvedAt, resolvedBy, messageId).run()

      const updated = await env.DB.prepare(`
        SELECT s.*, u.display_name as user_name, u.email as user_email
        FROM support_messages s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `).bind(messageId).first()

      return jsonResponse({ success: true, data: updated })
    } catch (err) {
      console.error('Update support message error:', err)
      return jsonResponse({ success: false, error: 'Failed to update support message' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
