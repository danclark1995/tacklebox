/**
 * Content Generation Routes
 * POST /generate/social         - generate social media image
 * POST /generate/document       - generate branded document
 * POST /generate/presentation   - generate branded slideshow
 * POST /generate/ad             - generate ad creative
 * GET  /generate/history        - generation history
 * GET  /generate/:id            - single generation
 * DELETE /generate/:id          - delete generation
 */

import { jsonResponse } from '../index.js'
import { requireRole } from '../middleware/auth.js'
import { generateContent } from '../services/content-generator.js'

const DIMENSIONS = {
  instagram_post: { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  instagram_banner: { width: 1080, height: 566 },
  instagram_cover: { width: 1080, height: 1080 },
  instagram_carousel: { width: 1080, height: 1080 },
  linkedin_post: { width: 1200, height: 627 },
  linkedin_banner: { width: 1584, height: 396 },
  linkedin_story: { width: 1080, height: 1920 },
  linkedin_cover: { width: 1584, height: 396 },
  facebook_post: { width: 1200, height: 630 },
  facebook_cover: { width: 820, height: 312 },
  facebook_story: { width: 1080, height: 1920 },
  facebook_banner: { width: 820, height: 312 },
  twitter_post: { width: 1600, height: 900 },
  twitter_banner: { width: 1500, height: 500 },
  twitter_story: { width: 1080, height: 1920 },
  twitter_cover: { width: 1500, height: 500 },
  // Ad formats
  social_square: { width: 1080, height: 1080 },
  social_story: { width: 1080, height: 1920 },
  leaderboard: { width: 728, height: 90 },
  medium_rectangle: { width: 300, height: 250 },
  wide_skyscraper: { width: 160, height: 600 },
}

function parseJsonFields(profile) {
  const JSON_FIELDS = ['brand_colours', 'metaphors', 'brand_values', 'archetypes',
    'messaging_pillars', 'colours_primary', 'colours_secondary', 'typography', 'imagery_guidelines']
  for (const f of JSON_FIELDS) {
    if (profile[f] && typeof profile[f] === 'string') {
      try { profile[f] = JSON.parse(profile[f]) } catch { profile[f] = null }
    }
  }
  return profile
}

async function getBrandProfile(env, profileId, auth) {
  const profile = await env.DB.prepare(`
    SELECT bp.*, u.display_name as client_name, u.company as client_company
    FROM brand_profiles bp LEFT JOIN users u ON bp.client_id = u.id
    WHERE bp.id = ?
  `).bind(profileId).first()

  if (!profile) return null

  // Check access
  if (auth.user.role === 'admin') { /* full access */ }
  else if (auth.user.role === 'client' && profile.client_id === auth.user.id) { /* own profile */ }
  else if (auth.user.role === 'contractor') {
    const assignedTask = await env.DB.prepare(
      'SELECT id FROM tasks WHERE client_id = ? AND contractor_id = ? LIMIT 1'
    ).bind(profile.client_id, auth.user.id).first()
    if (!assignedTask) return null
  }
  else return null

  return parseJsonFields(profile)
}

export async function handleGenerate(request, env, auth, path, method) {
  const authCheck = requireRole(auth, 'admin', 'contractor')
  if (!authCheck.authorized) return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)

  // --- POST /generate/social ---
  if (path === '/generate/social' && method === 'POST') {
    try {
      const body = await request.json()
      const { brand_profile_id, platform, format, prompt } = body
      if (!brand_profile_id || !platform || !prompt) {
        return jsonResponse({ success: false, error: 'brand_profile_id, platform, and prompt are required' }, 400)
      }

      const bp = await getBrandProfile(env, brand_profile_id, auth)
      if (!bp) return jsonResponse({ success: false, error: 'Brand profile not found or access denied' }, 404)

      const dimKey = `${platform}_${format || 'post'}`
      const dimensions = DIMENSIONS[dimKey] || DIMENSIONS.instagram_post

      const result = await generateContent(env, bp, 'social_image', `${platform}_${format || 'post'}`, prompt, {
        user_id: auth.user.id,
        client_id: bp.client_id,
        platform,
        format: format || 'post',
        dimensions,
      })

      return jsonResponse({ success: true, data: result })
    } catch (err) {
      console.error('Generate social error:', err)
      return jsonResponse({ success: false, error: 'Generation failed: ' + err.message }, 500)
    }
  }

  // --- POST /generate/document ---
  if (path === '/generate/document' && method === 'POST') {
    try {
      const body = await request.json()
      const { brand_profile_id, document_type, prompt, key_points, recipient } = body
      if (!brand_profile_id || !prompt) {
        return jsonResponse({ success: false, error: 'brand_profile_id and prompt are required' }, 400)
      }

      const bp = await getBrandProfile(env, brand_profile_id, auth)
      if (!bp) return jsonResponse({ success: false, error: 'Brand profile not found or access denied' }, 404)

      const result = await generateContent(env, bp, 'document', document_type || 'proposal', prompt, {
        user_id: auth.user.id,
        client_id: bp.client_id,
        key_points,
        recipient,
      })

      return jsonResponse({ success: true, data: result })
    } catch (err) {
      console.error('Generate document error:', err)
      return jsonResponse({ success: false, error: 'Generation failed: ' + err.message }, 500)
    }
  }

  // --- POST /generate/presentation ---
  if (path === '/generate/presentation' && method === 'POST') {
    try {
      const body = await request.json()
      const { brand_profile_id, topic, audience, num_slides, key_points, tone } = body
      if (!brand_profile_id || !topic) {
        return jsonResponse({ success: false, error: 'brand_profile_id and topic are required' }, 400)
      }

      const bp = await getBrandProfile(env, brand_profile_id, auth)
      if (!bp) return jsonResponse({ success: false, error: 'Brand profile not found or access denied' }, 404)

      const result = await generateContent(env, bp, 'presentation', 'slideshow', topic, {
        user_id: auth.user.id,
        client_id: bp.client_id,
        audience,
        num_slides: num_slides || 6,
        key_points,
        tone: tone || 'professional',
      })

      return jsonResponse({ success: true, data: result })
    } catch (err) {
      console.error('Generate presentation error:', err)
      return jsonResponse({ success: false, error: 'Generation failed: ' + err.message }, 500)
    }
  }

  // --- POST /generate/ad ---
  if (path === '/generate/ad' && method === 'POST') {
    try {
      const body = await request.json()
      const { brand_profile_id, ad_format, headline, cta_text, offer, prompt } = body
      if (!brand_profile_id || !ad_format) {
        return jsonResponse({ success: false, error: 'brand_profile_id and ad_format are required' }, 400)
      }

      const bp = await getBrandProfile(env, brand_profile_id, auth)
      if (!bp) return jsonResponse({ success: false, error: 'Brand profile not found or access denied' }, 404)

      const dimensions = DIMENSIONS[ad_format] || DIMENSIONS.social_square

      const result = await generateContent(env, bp, 'ad_creative', ad_format, prompt || offer || headline || 'Brand advertisement', {
        user_id: auth.user.id,
        client_id: bp.client_id,
        headline,
        cta_text,
        offer,
        dimensions,
      })

      return jsonResponse({ success: true, data: result })
    } catch (err) {
      console.error('Generate ad error:', err)
      return jsonResponse({ success: false, error: 'Generation failed: ' + err.message }, 500)
    }
  }

  // --- GET /generate/history ---
  if (path.startsWith('/generate/history') && method === 'GET') {
    try {
      const url = new URL(request.url)
      const clientId = url.searchParams.get('client_id')
      const contentType = url.searchParams.get('content_type')
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
      const offset = (page - 1) * limit

      let where = []
      let bindings = []

      // Role-scoped access
      if (auth.user.role === 'client') {
        where.push('g.client_id = ?')
        bindings.push(auth.user.id)
      } else if (clientId) {
        where.push('g.client_id = ?')
        bindings.push(clientId)
      }

      if (contentType) {
        where.push('g.content_type = ?')
        bindings.push(contentType)
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

      const countResult = await env.DB.prepare(
        `SELECT COUNT(*) as total FROM generations g ${whereClause}`
      ).bind(...bindings).first()

      const { results } = await env.DB.prepare(
        `SELECT g.*, u.display_name as user_name FROM generations g LEFT JOIN users u ON g.user_id = u.id ${whereClause} ORDER BY g.created_at DESC LIMIT ? OFFSET ?`
      ).bind(...bindings, limit, offset).all()

      // Parse metadata
      for (const r of results) {
        if (r.metadata) { try { r.metadata = JSON.parse(r.metadata) } catch { r.metadata = {} } }
      }

      return jsonResponse({
        success: true,
        data: results,
        pagination: { page, limit, total: countResult?.total || 0, pages: Math.ceil((countResult?.total || 0) / limit) },
      })
    } catch (err) {
      console.error('Get generation history error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch history' }, 500)
    }
  }

  // --- GET /generate/:id ---
  const getMatch = path.match(/^\/generate\/([a-f0-9-]+)$/)
  if (getMatch && method === 'GET') {
    try {
      const gen = await env.DB.prepare('SELECT * FROM generations WHERE id = ?').bind(getMatch[1]).first()
      if (!gen) return jsonResponse({ success: false, error: 'Generation not found' }, 404)

      // Access check
      if (auth.user.role === 'client' && gen.client_id !== auth.user.id) {
        return jsonResponse({ success: false, error: 'Access denied' }, 403)
      }

      if (gen.metadata) { try { gen.metadata = JSON.parse(gen.metadata) } catch { gen.metadata = {} } }

      return jsonResponse({ success: true, data: gen })
    } catch (err) {
      console.error('Get generation error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch generation' }, 500)
    }
  }

  // --- DELETE /generate/:id ---
  const deleteMatch = path.match(/^\/generate\/([a-f0-9-]+)$/)
  if (deleteMatch && method === 'DELETE') {
    try {
      const gen = await env.DB.prepare('SELECT * FROM generations WHERE id = ?').bind(deleteMatch[1]).first()
      if (!gen) return jsonResponse({ success: false, error: 'Generation not found' }, 404)

      if (auth.user.role === 'client' && gen.client_id !== auth.user.id) {
        return jsonResponse({ success: false, error: 'Access denied' }, 403)
      }

      // Delete R2 files
      if (gen.result_path) {
        try { await env.tacklebox_storage.delete(gen.result_path) } catch { /* ignore */ }
      }
      if (gen.metadata) {
        try {
          const meta = JSON.parse(gen.metadata)
          if (meta.background_path) await env.tacklebox_storage.delete(meta.background_path)
        } catch { /* ignore */ }
      }

      await env.DB.prepare('DELETE FROM generations WHERE id = ?').bind(deleteMatch[1]).run()
      return jsonResponse({ success: true, data: { deleted: deleteMatch[1] } })
    } catch (err) {
      console.error('Delete generation error:', err)
      return jsonResponse({ success: false, error: 'Failed to delete generation' }, 500)
    }
  }

  // --- POST /generate/attach-to-task ---
  if (path === '/generate/attach-to-task' && method === 'POST') {
    try {
      const body = await request.json()
      const { generation_id, task_id } = body
      if (!generation_id || !task_id) {
        return jsonResponse({ success: false, error: 'generation_id and task_id are required' }, 400)
      }

      const gen = await env.DB.prepare('SELECT * FROM generations WHERE id = ?').bind(generation_id).first()
      if (!gen) return jsonResponse({ success: false, error: 'Generation not found' }, 404)
      if (!gen.result_path) return jsonResponse({ success: false, error: 'Generation has no output file' }, 400)

      const task = await env.DB.prepare(
        'SELECT id, client_id, contractor_id FROM tasks WHERE id = ?'
      ).bind(task_id).first()
      if (!task) return jsonResponse({ success: false, error: 'Task not found' }, 404)

      const hasAccess = auth.user.role === 'admin' ||
        (auth.user.role === 'contractor' && task.contractor_id === auth.user.id)
      if (!hasAccess) return jsonResponse({ success: false, error: 'Insufficient permissions' }, 403)

      const sourceObject = await env.tacklebox_storage.get(gen.result_path)
      if (!sourceObject) return jsonResponse({ success: false, error: 'Generated file not found in storage' }, 404)

      const ext = gen.result_type === 'image/png' ? 'png' : 'html'
      const fileName = `ai_generated_${gen.content_type}_${gen.id.substring(0, 8)}.${ext}`
      const attachmentFileId = crypto.randomUUID()
      const r2Key = `attachments/${task_id}/${attachmentFileId}_${fileName}`

      await env.tacklebox_storage.put(r2Key, sourceObject.body, {
        httpMetadata: { contentType: gen.result_type },
      })

      const attachmentId = crypto.randomUUID()
      const fileSize = sourceObject.size || 0
      await env.DB.prepare(`
        INSERT INTO task_attachments (id, task_id, uploaded_by, file_name, file_path, file_type, file_size, upload_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'deliverable')
      `).bind(attachmentId, task_id, auth.user.id, fileName, r2Key, gen.result_type, fileSize).run()

      await env.DB.prepare(
        'UPDATE users SET storage_used_bytes = storage_used_bytes + ? WHERE id = ?'
      ).bind(fileSize, auth.user.id).run()

      const newAttachment = await env.DB.prepare(`
        SELECT a.*, u.display_name as uploader_name
        FROM task_attachments a LEFT JOIN users u ON a.uploaded_by = u.id
        WHERE a.id = ?
      `).bind(attachmentId).first()

      return jsonResponse({ success: true, data: newAttachment }, 201)
    } catch (err) {
      console.error('Attach generation to task error:', err)
      return jsonResponse({ success: false, error: 'Failed to attach generation to task' }, 500)
    }
  }

  // GET /generate/stats - AI generation statistics (admin only)
  if (path === '/generate/stats' && method === 'GET') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const [aiTasksResult, generationsResult] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM tasks WHERE complexity_level = 0').first(),
        env.DB.prepare('SELECT COUNT(*) as count FROM generations').first(),
      ])

      return jsonResponse({
        success: true,
        data: {
          ai_assisted_tasks: aiTasksResult?.count || 0,
          total_generations: generationsResult?.count || 0,
        },
      })
    } catch (err) {
      console.error('Generate stats error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch stats' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
