/**
 * Brand Profile Routes
 * GET /brand-profiles/:clientId - get brand profile for a client
 * POST /brand-profiles - create/upsert brand profile (admin only)
 * PUT /brand-profiles/:clientId - update brand profile (admin only)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export async function handleBrandProfiles(request, env, auth, path, method) {
  // GET /brand-profiles/:clientId - get brand profile for a client
  const getMatch = path.match(/^\/brand-profiles\/([^\/]+)$/)
  if (getMatch && method === 'GET') {
    const clientId = getMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // Verify client exists
      const client = await env.DB.prepare(
        'SELECT id, role FROM users WHERE id = ? AND role = "client"'
      ).bind(clientId).first()

      if (!client) {
        return jsonResponse(
          { success: false, error: 'Client not found' },
          404
        )
      }

      // Check permissions
      let hasAccess = false

      if (auth.user.role === 'admin') {
        hasAccess = true
      } else if (auth.user.role === 'client' && auth.user.id === clientId) {
        hasAccess = true
      } else if (auth.user.role === 'contractor') {
        // Contractor can see profile for clients they have assigned tasks for
        const assignedTask = await env.DB.prepare(
          'SELECT id FROM tasks WHERE client_id = ? AND contractor_id = ? LIMIT 1'
        ).bind(clientId, auth.user.id).first()

        if (assignedTask) {
          hasAccess = true
        }
      }

      if (!hasAccess) {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      // Fetch brand profile
      const profile = await env.DB.prepare(`
        SELECT bp.*,
          u.display_name as client_name,
          u.company as client_company
        FROM brand_profiles bp
        LEFT JOIN users u ON bp.client_id = u.id
        WHERE bp.client_id = ?
      `).bind(clientId).first()

      if (!profile) {
        return jsonResponse(
          { success: false, error: 'Brand profile not found' },
          404
        )
      }

      // Parse JSON fields
      if (profile.brand_colours) {
        try {
          profile.brand_colours = JSON.parse(profile.brand_colours)
        } catch (e) {
          profile.brand_colours = null
        }
      }

      return jsonResponse({
        success: true,
        data: profile,
      })
    } catch (err) {
      console.error('Get brand profile error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch brand profile' },
        500
      )
    }
  }

  // POST /brand-profiles - create/upsert brand profile (admin only)
  if (path === '/brand-profiles' && method === 'POST') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const body = await request.json()
      const {
        client_id,
        logo_path,
        brand_colours,
        voice_tone,
        core_values,
        mission_statement,
        target_audience,
        dos,
        donts,
        additional_notes,
      } = body

      if (!client_id) {
        return jsonResponse(
          { success: false, error: 'client_id is required' },
          400
        )
      }

      // Verify client exists
      const client = await env.DB.prepare(
        'SELECT id FROM users WHERE id = ? AND role = "client"'
      ).bind(client_id).first()

      if (!client) {
        return jsonResponse(
          { success: false, error: 'Invalid client_id' },
          400
        )
      }

      // Check if profile already exists
      const existing = await env.DB.prepare(
        'SELECT id FROM brand_profiles WHERE client_id = ?'
      ).bind(client_id).first()

      // Serialize brand_colours if it's an object/array
      const brandColoursJson = brand_colours ? JSON.stringify(brand_colours) : null

      if (existing) {
        // Update existing profile
        await env.DB.prepare(`
          UPDATE brand_profiles SET
            logo_path = ?,
            brand_colours = ?,
            voice_tone = ?,
            core_values = ?,
            mission_statement = ?,
            target_audience = ?,
            dos = ?,
            donts = ?,
            additional_notes = ?,
            updated_at = datetime('now')
          WHERE client_id = ?
        `).bind(
          logo_path || null,
          brandColoursJson,
          voice_tone || null,
          core_values || null,
          mission_statement || null,
          target_audience || null,
          dos || null,
          donts || null,
          additional_notes || null,
          client_id
        ).run()
      } else {
        // Create new profile
        const profileId = crypto.randomUUID()
        await env.DB.prepare(`
          INSERT INTO brand_profiles (
            id, client_id, logo_path, brand_colours, voice_tone, core_values,
            mission_statement, target_audience, dos, donts, additional_notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          profileId,
          client_id,
          logo_path || null,
          brandColoursJson,
          voice_tone || null,
          core_values || null,
          mission_statement || null,
          target_audience || null,
          dos || null,
          donts || null,
          additional_notes || null
        ).run()
      }

      // Fetch the profile
      const profile = await env.DB.prepare(`
        SELECT bp.*,
          u.display_name as client_name,
          u.company as client_company
        FROM brand_profiles bp
        LEFT JOIN users u ON bp.client_id = u.id
        WHERE bp.client_id = ?
      `).bind(client_id).first()

      // Parse JSON fields
      if (profile.brand_colours) {
        try {
          profile.brand_colours = JSON.parse(profile.brand_colours)
        } catch (e) {
          profile.brand_colours = null
        }
      }

      return jsonResponse(
        {
          success: true,
          data: profile,
        },
        existing ? 200 : 201
      )
    } catch (err) {
      console.error('Create/update brand profile error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to save brand profile' },
        500
      )
    }
  }

  // PUT /brand-profiles/:clientId - update brand profile (admin only)
  const updateMatch = path.match(/^\/brand-profiles\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const clientId = updateMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // Check if profile exists
      const existing = await env.DB.prepare(
        'SELECT id FROM brand_profiles WHERE client_id = ?'
      ).bind(clientId).first()

      if (!existing) {
        return jsonResponse(
          { success: false, error: 'Brand profile not found' },
          404
        )
      }

      const body = await request.json()

      const updates = []
      const bindings = []

      if (body.logo_path !== undefined) {
        updates.push('logo_path = ?')
        bindings.push(body.logo_path)
      }
      if (body.brand_colours !== undefined) {
        updates.push('brand_colours = ?')
        bindings.push(body.brand_colours ? JSON.stringify(body.brand_colours) : null)
      }
      if (body.voice_tone !== undefined) {
        updates.push('voice_tone = ?')
        bindings.push(body.voice_tone)
      }
      if (body.core_values !== undefined) {
        updates.push('core_values = ?')
        bindings.push(body.core_values)
      }
      if (body.mission_statement !== undefined) {
        updates.push('mission_statement = ?')
        bindings.push(body.mission_statement)
      }
      if (body.target_audience !== undefined) {
        updates.push('target_audience = ?')
        bindings.push(body.target_audience)
      }
      if (body.dos !== undefined) {
        updates.push('dos = ?')
        bindings.push(body.dos)
      }
      if (body.donts !== undefined) {
        updates.push('donts = ?')
        bindings.push(body.donts)
      }
      if (body.additional_notes !== undefined) {
        updates.push('additional_notes = ?')
        bindings.push(body.additional_notes)
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: 'No fields to update' },
          400
        )
      }

      updates.push('updated_at = datetime("now")')
      bindings.push(clientId)

      await env.DB.prepare(`
        UPDATE brand_profiles SET ${updates.join(', ')} WHERE client_id = ?
      `).bind(...bindings).run()

      const updatedProfile = await env.DB.prepare(`
        SELECT bp.*,
          u.display_name as client_name,
          u.company as client_company
        FROM brand_profiles bp
        LEFT JOIN users u ON bp.client_id = u.id
        WHERE bp.client_id = ?
      `).bind(clientId).first()

      // Parse JSON fields
      if (updatedProfile.brand_colours) {
        try {
          updatedProfile.brand_colours = JSON.parse(updatedProfile.brand_colours)
        } catch (e) {
          updatedProfile.brand_colours = null
        }
      }

      return jsonResponse({
        success: true,
        data: updatedProfile,
      })
    } catch (err) {
      console.error('Update brand profile error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to update brand profile' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
