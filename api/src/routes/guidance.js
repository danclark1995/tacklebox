/**
 * Guidance Routes
 * GET    /guidance          - list all guidance sections (any authenticated user)
 * PUT    /guidance/:key     - update a guidance section (admin or Camp Leader level 7+)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

async function canEditGuidance(auth, env) {
  // Admin can always edit
  if (auth.user.role === 'admin') return true

  // Contractors at level 7+ (Camp Leader) can edit
  if (auth.user.role === 'contractor') {
    const xp = await env.DB.prepare(
      'SELECT cx.total_xp, xl.level FROM contractor_xp cx JOIN xp_levels xl ON cx.total_xp >= xl.xp_required WHERE cx.contractor_id = ? ORDER BY xl.level DESC LIMIT 1'
    ).bind(auth.user.id).first()

    return xp && xp.level >= 7
  }

  return false
}

export async function handleGuidance(request, env, auth, path, method) {
  // GET /guidance - list all sections
  if (path === '/guidance' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const result = await env.DB.prepare(
        'SELECT * FROM guidance_sections ORDER BY display_order ASC'
      ).all()

      const sections = (result.results || []).map(s => ({
        ...s,
        content: (() => { try { return JSON.parse(s.content) } catch { return s.content } })(),
      }))

      return jsonResponse({ success: true, data: sections })
    } catch (err) {
      console.error('List guidance error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch guidance' }, 500)
    }
  }

  // PUT /guidance/:key - update a section
  const updateMatch = path.match(/^\/guidance\/([^/]+)$/)
  if (updateMatch && method === 'PUT') {
    const sectionKey = decodeURIComponent(updateMatch[1])

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    const allowed = await canEditGuidance(auth, env)
    if (!allowed) {
      return jsonResponse({ success: false, error: 'Only Admin or Camp Leader (Lv.7+) can edit guidance' }, 403)
    }

    try {
      const existing = await env.DB.prepare(
        'SELECT id FROM guidance_sections WHERE section_key = ?'
      ).bind(sectionKey).first()

      if (!existing) {
        return jsonResponse({ success: false, error: 'Section not found' }, 404)
      }

      const body = await request.json()
      const { title, content } = body

      const updates = []
      const values = []

      if (title !== undefined) { updates.push('title = ?'); values.push(title) }
      if (content !== undefined) {
        updates.push('content = ?')
        values.push(typeof content === 'string' ? content : JSON.stringify(content))
      }

      if (updates.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400)
      }

      updates.push('updated_by = ?')
      values.push(auth.user.id)
      updates.push("updated_at = datetime('now')")

      values.push(sectionKey)
      await env.DB.prepare(
        `UPDATE guidance_sections SET ${updates.join(', ')} WHERE section_key = ?`
      ).bind(...values).run()

      const updated = await env.DB.prepare(
        'SELECT * FROM guidance_sections WHERE section_key = ?'
      ).bind(sectionKey).first()

      return jsonResponse({
        success: true,
        data: {
          ...updated,
          content: (() => { try { return JSON.parse(updated.content) } catch { return updated.content } })(),
        },
      })
    } catch (err) {
      console.error('Update guidance error:', err)
      return jsonResponse({ success: false, error: 'Failed to update guidance' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
