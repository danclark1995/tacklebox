/**
 * Tool Links Routes
 * GET    /tools      - list all active tool links
 * POST   /tools      - create tool link (admin only)
 * PUT    /tools/:id  - update tool link (admin only)
 * DELETE /tools/:id  - delete tool link (admin only)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export async function handleTools(request, env, auth, path, method) {
  // GET /tools - list all active tool links
  if (path === '/tools' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const result = await env.DB.prepare(
        'SELECT * FROM tool_links WHERE is_active = 1 ORDER BY display_order ASC'
      ).all()

      return jsonResponse({ success: true, data: result.results || [] })
    } catch (err) {
      console.error('List tools error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch tools' }, 500)
    }
  }

  // POST /tools - create tool link (admin only)
  if (path === '/tools' && method === 'POST') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const body = await request.json()
      const { name, description, url, icon_name } = body

      if (!name || !url) {
        return jsonResponse({ success: false, error: 'name and url are required' }, 400)
      }

      const maxOrder = await env.DB.prepare(
        'SELECT COALESCE(MAX(display_order), 0) as max_order FROM tool_links'
      ).first()

      const id = crypto.randomUUID()

      await env.DB.prepare(`
        INSERT INTO tool_links (id, name, description, url, icon_name, display_order, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        name,
        description || null,
        url,
        icon_name || 'link',
        (maxOrder?.max_order || 0) + 1,
        auth.user.id
      ).run()

      const created = await env.DB.prepare(
        'SELECT * FROM tool_links WHERE id = ?'
      ).bind(id).first()

      return jsonResponse({ success: true, data: created }, 201)
    } catch (err) {
      console.error('Create tool error:', err)
      return jsonResponse({ success: false, error: 'Failed to create tool' }, 500)
    }
  }

  // PUT /tools/:id - update tool link (admin only)
  const updateMatch = path.match(/^\/tools\/([^/]+)$/)
  if (updateMatch && method === 'PUT') {
    const toolId = updateMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const existing = await env.DB.prepare(
        'SELECT id FROM tool_links WHERE id = ?'
      ).bind(toolId).first()

      if (!existing) {
        return jsonResponse({ success: false, error: 'Tool not found' }, 404)
      }

      const body = await request.json()
      const { name, description, url, icon_name, display_order, is_active } = body

      const updates = []
      const values = []

      if (name !== undefined) { updates.push('name = ?'); values.push(name) }
      if (description !== undefined) { updates.push('description = ?'); values.push(description) }
      if (url !== undefined) { updates.push('url = ?'); values.push(url) }
      if (icon_name !== undefined) { updates.push('icon_name = ?'); values.push(icon_name) }
      if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order) }
      if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active) }

      if (updates.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400)
      }

      values.push(toolId)
      await env.DB.prepare(
        `UPDATE tool_links SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run()

      const updated = await env.DB.prepare(
        'SELECT * FROM tool_links WHERE id = ?'
      ).bind(toolId).first()

      return jsonResponse({ success: true, data: updated })
    } catch (err) {
      console.error('Update tool error:', err)
      return jsonResponse({ success: false, error: 'Failed to update tool' }, 500)
    }
  }

  // DELETE /tools/:id - delete tool link (admin only)
  if (updateMatch && method === 'DELETE') {
    const toolId = updateMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const existing = await env.DB.prepare(
        'SELECT id FROM tool_links WHERE id = ?'
      ).bind(toolId).first()

      if (!existing) {
        return jsonResponse({ success: false, error: 'Tool not found' }, 404)
      }

      await env.DB.prepare('DELETE FROM tool_links WHERE id = ?').bind(toolId).run()

      return jsonResponse({ success: true })
    } catch (err) {
      console.error('Delete tool error:', err)
      return jsonResponse({ success: false, error: 'Failed to delete tool' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
