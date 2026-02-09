/**
 * Brand Profile Routes
 * GET    /brand-profiles/:clientId        - get brand profile for a client
 * POST   /brand-profiles                  - create/upsert brand profile (admin only)
 * PUT    /brand-profiles/:clientId        - update brand profile fields (admin only)
 * GET    /brand-profiles/:clientId/logos   - list logos for a brand profile
 * POST   /brand-profiles/:clientId/logos   - add a logo variant (admin only)
 * DELETE /brand-profiles/:clientId/logos/:logoId - delete a logo (admin only)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

// All JSON fields stored in brand_profiles
const JSON_FIELDS = [
  'brand_colours', 'metaphors', 'brand_values', 'archetypes',
  'messaging_pillars', 'colours_primary', 'colours_secondary',
  'typography', 'imagery_guidelines',
]

// All text fields on brand_profiles
const TEXT_FIELDS = [
  'logo_path', 'voice_tone', 'core_values', 'mission_statement',
  'target_audience', 'dos', 'donts', 'additional_notes',
  'industry', 'tagline', 'strategic_tasks', 'founder_story',
  'brand_narrative', 'brand_guide_path',
]

const ALL_FIELDS = [...TEXT_FIELDS, ...JSON_FIELDS]

function parseJsonFields(profile) {
  if (!profile) return profile
  for (const field of JSON_FIELDS) {
    if (profile[field]) {
      try { profile[field] = JSON.parse(profile[field]) }
      catch { profile[field] = null }
    }
  }
  return profile
}

function fetchProfile(env, clientId) {
  return env.DB.prepare(`
    SELECT bp.*,
      u.display_name as client_name,
      u.company as client_company
    FROM brand_profiles bp
    LEFT JOIN users u ON bp.client_id = u.id
    WHERE bp.client_id = ?
  `).bind(clientId).first()
}

export async function handleBrandProfiles(request, env, auth, path, method) {

  // --- Logo routes: /brand-profiles/:clientId/logos ---
  const logosMatch = path.match(/^\/brand-profiles\/([^\/]+)\/logos(?:\/([^\/]+))?$/)
  if (logosMatch) {
    const clientId = logosMatch[1]
    const logoId = logosMatch[2]

    // GET /brand-profiles/:clientId/logos
    if (method === 'GET' && !logoId) {
      const authCheck = requireAuth(auth)
      if (!authCheck.authorized) return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)

      try {
        const profile = await env.DB.prepare('SELECT id FROM brand_profiles WHERE client_id = ?').bind(clientId).first()
        if (!profile) return jsonResponse({ success: false, error: 'Brand profile not found' }, 404)

        const { results } = await env.DB.prepare(
          'SELECT * FROM brand_logos WHERE brand_profile_id = ? ORDER BY created_at DESC'
        ).bind(profile.id).all()

        return jsonResponse({ success: true, data: results })
      } catch (err) {
        console.error('Get brand logos error:', err)
        return jsonResponse({ success: false, error: 'Failed to fetch logos' }, 500)
      }
    }

    // POST /brand-profiles/:clientId/logos
    if (method === 'POST' && !logoId) {
      const authCheck = requireRole(auth, 'admin')
      if (!authCheck.authorized) return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)

      try {
        const profile = await env.DB.prepare('SELECT id FROM brand_profiles WHERE client_id = ?').bind(clientId).first()
        if (!profile) return jsonResponse({ success: false, error: 'Brand profile not found' }, 404)

        const body = await request.json()
        const { variant_name, file_path, background_type, logo_type } = body

        if (!file_path) return jsonResponse({ success: false, error: 'file_path is required' }, 400)

        const id = crypto.randomUUID()
        await env.DB.prepare(`
          INSERT INTO brand_logos (id, brand_profile_id, variant_name, file_path, background_type, logo_type)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          id, profile.id,
          variant_name || null,
          file_path,
          background_type || 'transparent',
          logo_type || 'primary'
        ).run()

        const logo = await env.DB.prepare('SELECT * FROM brand_logos WHERE id = ?').bind(id).first()
        return jsonResponse({ success: true, data: logo }, 201)
      } catch (err) {
        console.error('Create brand logo error:', err)
        return jsonResponse({ success: false, error: 'Failed to create logo' }, 500)
      }
    }

    // DELETE /brand-profiles/:clientId/logos/:logoId
    if (method === 'DELETE' && logoId) {
      const authCheck = requireRole(auth, 'admin')
      if (!authCheck.authorized) return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)

      try {
        const logo = await env.DB.prepare('SELECT id FROM brand_logos WHERE id = ?').bind(logoId).first()
        if (!logo) return jsonResponse({ success: false, error: 'Logo not found' }, 404)

        await env.DB.prepare('DELETE FROM brand_logos WHERE id = ?').bind(logoId).run()
        return jsonResponse({ success: true, data: { deleted: logoId } })
      } catch (err) {
        console.error('Delete brand logo error:', err)
        return jsonResponse({ success: false, error: 'Failed to delete logo' }, 500)
      }
    }
  }

  // --- GET /brand-profiles/:clientId ---
  const getMatch = path.match(/^\/brand-profiles\/([^\/]+)$/)
  if (getMatch && method === 'GET') {
    const clientId = getMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)

    try {
      const client = await env.DB.prepare(
        'SELECT id, role FROM users WHERE id = ? AND role = "client"'
      ).bind(clientId).first()

      if (!client) return jsonResponse({ success: false, error: 'Client not found' }, 404)

      // Permission check
      let hasAccess = false
      if (auth.user.role === 'admin') hasAccess = true
      else if (auth.user.role === 'client' && auth.user.id === clientId) hasAccess = true
      else if (auth.user.role === 'contractor') {
        const assignedTask = await env.DB.prepare(
          'SELECT id FROM tasks WHERE client_id = ? AND contractor_id = ? LIMIT 1'
        ).bind(clientId, auth.user.id).first()
        if (assignedTask) hasAccess = true
      }

      if (!hasAccess) return jsonResponse({ success: false, error: 'Insufficient permissions' }, 403)

      const profile = await fetchProfile(env, clientId)
      if (!profile) return jsonResponse({ success: false, error: 'Brand profile not found' }, 404)

      parseJsonFields(profile)

      return jsonResponse({ success: true, data: profile })
    } catch (err) {
      console.error('Get brand profile error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch brand profile' }, 500)
    }
  }

  // --- POST /brand-profiles ---
  if (path === '/brand-profiles' && method === 'POST') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)

    try {
      const body = await request.json()
      const { client_id } = body

      if (!client_id) return jsonResponse({ success: false, error: 'client_id is required' }, 400)

      const client = await env.DB.prepare(
        'SELECT id FROM users WHERE id = ? AND role = "client"'
      ).bind(client_id).first()
      if (!client) return jsonResponse({ success: false, error: 'Invalid client_id' }, 400)

      const existing = await env.DB.prepare(
        'SELECT id FROM brand_profiles WHERE client_id = ?'
      ).bind(client_id).first()

      if (existing) {
        // Build dynamic update
        const updates = []
        const bindings = []
        for (const field of ALL_FIELDS) {
          if (body[field] !== undefined) {
            updates.push(`${field} = ?`)
            bindings.push(JSON_FIELDS.includes(field) && body[field] ? JSON.stringify(body[field]) : (body[field] || null))
          }
        }
        if (updates.length > 0) {
          updates.push('updated_at = datetime("now")')
          bindings.push(client_id)
          await env.DB.prepare(
            `UPDATE brand_profiles SET ${updates.join(', ')} WHERE client_id = ?`
          ).bind(...bindings).run()
        }
      } else {
        const profileId = crypto.randomUUID()
        const columns = ['id', 'client_id']
        const placeholders = ['?', '?']
        const bindings = [profileId, client_id]

        for (const field of ALL_FIELDS) {
          if (body[field] !== undefined) {
            columns.push(field)
            placeholders.push('?')
            bindings.push(JSON_FIELDS.includes(field) && body[field] ? JSON.stringify(body[field]) : (body[field] || null))
          }
        }

        await env.DB.prepare(
          `INSERT INTO brand_profiles (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
        ).bind(...bindings).run()
      }

      const profile = await fetchProfile(env, client_id)
      parseJsonFields(profile)

      return jsonResponse({ success: true, data: profile }, existing ? 200 : 201)
    } catch (err) {
      console.error('Create/update brand profile error:', err)
      return jsonResponse({ success: false, error: 'Failed to save brand profile' }, 500)
    }
  }

  // --- PUT /brand-profiles/:clientId ---
  const updateMatch = path.match(/^\/brand-profiles\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const clientId = updateMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)

    try {
      const existing = await env.DB.prepare(
        'SELECT id FROM brand_profiles WHERE client_id = ?'
      ).bind(clientId).first()

      // Auto-create if not exists
      if (!existing) {
        const profileId = crypto.randomUUID()
        await env.DB.prepare(
          'INSERT INTO brand_profiles (id, client_id) VALUES (?, ?)'
        ).bind(profileId, clientId).run()
      }

      const body = await request.json()
      const updates = []
      const bindings = []

      for (const field of ALL_FIELDS) {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`)
          bindings.push(JSON_FIELDS.includes(field) && body[field] ? JSON.stringify(body[field]) : (body[field] || null))
        }
      }

      if (updates.length === 0) return jsonResponse({ success: false, error: 'No fields to update' }, 400)

      updates.push('updated_at = datetime("now")')
      bindings.push(clientId)

      await env.DB.prepare(
        `UPDATE brand_profiles SET ${updates.join(', ')} WHERE client_id = ?`
      ).bind(...bindings).run()

      const profile = await fetchProfile(env, clientId)
      parseJsonFields(profile)

      return jsonResponse({ success: true, data: profile })
    } catch (err) {
      console.error('Update brand profile error:', err)
      return jsonResponse({ success: false, error: 'Failed to update brand profile' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
