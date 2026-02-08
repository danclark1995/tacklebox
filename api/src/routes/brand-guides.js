/**
 * Brand Guides Routes
 * Upload and list brand guide documents per client.
 * Admin-only upload. All authenticated users can view (role-filtered).
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export async function handleBrandGuides(request, env, auth, path, method) {
  // GET /brand-guides?client_id=
  if (path === '/brand-guides' && method === 'GET') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const url = new URL(request.url)
    const clientId = url.searchParams.get('client_id')
    const user = auth.user

    // Role-based filtering
    if (user.role === 'client') {
      const guides = await env.DB.prepare(
        'SELECT * FROM brand_guides WHERE client_id = ? ORDER BY created_at DESC'
      ).bind(user.id).all()
      return jsonResponse({ success: true, data: guides.results })
    }

    if (user.role === 'contractor') {
      // Contractor can see guides for clients whose tasks they're assigned to
      let query = `SELECT bg.* FROM brand_guides bg
        WHERE bg.client_id IN (SELECT DISTINCT client_id FROM tasks WHERE contractor_id = ?)`
      const params = [user.id]
      if (clientId) {
        query += ' AND bg.client_id = ?'
        params.push(clientId)
      }
      query += ' ORDER BY bg.created_at DESC'
      const guides = await env.DB.prepare(query).bind(...params).all()
      return jsonResponse({ success: true, data: guides.results })
    }

    // Admin sees all or filtered by client
    let query = 'SELECT * FROM brand_guides'
    const params = []
    if (clientId) {
      query += ' WHERE client_id = ?'
      params.push(clientId)
    }
    query += ' ORDER BY created_at DESC'
    const guides = params.length
      ? await env.DB.prepare(query).bind(...params).all()
      : await env.DB.prepare(query).all()
    return jsonResponse({ success: true, data: guides.results })
  }

  // POST /brand-guides — admin only, upload guide
  if (path === '/brand-guides' && method === 'POST') {
    const check = requireRole(auth, 'admin')
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    try {
      const formData = await request.formData()
      const file = formData.get('file')
      const clientId = formData.get('client_id')
      const title = formData.get('title')

      if (!file || !clientId || !title) {
        return jsonResponse({ success: false, error: 'file, client_id, and title are required' }, 400)
      }

      // Validate file type
      const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg']
      const ext = '.' + file.name.split('.').pop().toLowerCase()
      if (!allowedTypes.includes(ext)) {
        return jsonResponse({ success: false, error: 'Only PDF, PNG, JPG files allowed for brand guides' }, 400)
      }

      // Verify client exists
      const client = await env.DB.prepare('SELECT id FROM users WHERE id = ? AND role = ?').bind(clientId, 'client').first()
      if (!client) {
        return jsonResponse({ success: false, error: 'Client not found' }, 404)
      }

      const id = crypto.randomUUID()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `brand-guides/${clientId}/${id}_${safeFileName}`

      // Upload to R2
      await env.tacklebox_storage.put(filePath, file.stream(), {
        httpMetadata: { contentType: file.type },
      })

      // Create DB record
      await env.DB.prepare(
        `INSERT INTO brand_guides (id, client_id, title, file_path, file_type, uploaded_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(id, clientId, title, filePath, file.type, auth.user.id).run()

      const guide = await env.DB.prepare('SELECT * FROM brand_guides WHERE id = ?').bind(id).first()
      return jsonResponse({ success: true, data: guide }, 201)
    } catch (err) {
      console.error('Brand guide upload error:', err)
      return jsonResponse({ success: false, error: 'Failed to upload brand guide' }, 500)
    }
  }

  // DELETE /brand-guides/:id — admin only
  const deleteMatch = path.match(/^\/brand-guides\/([^/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    const check = requireRole(auth, 'admin')
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const guideId = deleteMatch[1]
    const guide = await env.DB.prepare('SELECT * FROM brand_guides WHERE id = ?').bind(guideId).first()
    if (!guide) {
      return jsonResponse({ success: false, error: 'Brand guide not found' }, 404)
    }

    // Delete from R2
    await env.tacklebox_storage.delete(guide.file_path)

    // Delete DB record
    await env.DB.prepare('DELETE FROM brand_guides WHERE id = ?').bind(guideId).run()

    return jsonResponse({ success: true, data: { deleted: true } })
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
