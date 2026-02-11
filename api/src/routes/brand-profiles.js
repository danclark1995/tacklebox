/**
 * Brand Profile Routes
 * GET    /brand-profiles/:clientId           - get brand profile for a client
 * POST   /brand-profiles                     - create/upsert brand profile (admin only)
 * PUT    /brand-profiles/:clientId           - update brand profile fields (admin only)
 * POST   /brand-profiles/:clientId/extract   - extract brand profile from PDF (admin only)
 * GET    /brand-profiles/:clientId/logos      - list logos for a brand profile
 * POST   /brand-profiles/:clientId/logos      - add a logo variant (admin only)
 * DELETE /brand-profiles/:clientId/logos/:logoId - delete a logo (admin only)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

// ---- Lightweight PDF text extractor for Workers ----

async function decompressStream(bytes, format) {
  const ds = new DecompressionStream(format)
  const writer = ds.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const chunks = []
  const reader = ds.readable.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0)
  const merged = new Uint8Array(totalLen)
  let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length }
  return new TextDecoder('latin1').decode(merged)
}

function decodePDFString(str) {
  return str
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\')
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
}

function extractTextOperators(content) {
  const parts = []
  let m
  // Tj: (text) Tj
  const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g
  while ((m = tjRe.exec(content)) !== null) parts.push(decodePDFString(m[1]))
  // TJ: [(text) num ...] TJ
  const tjArrRe = /\[((?:[^\[\]]*|\[(?:[^\[\]]*)\])*)\]\s*TJ/g
  while ((m = tjArrRe.exec(content)) !== null) {
    let line = ''
    for (const p of m[1].matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g)) line += decodePDFString(p[1])
    if (line) parts.push(line)
  }
  // ' operator: (text) '
  const quoteRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*'/g
  while ((m = quoteRe.exec(content)) !== null) parts.push(decodePDFString(m[1]))
  return parts.join(' ')
}

async function extractTextFromPDF(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer)
  const raw = new TextDecoder('latin1').decode(bytes)
  const extractedParts = []

  // Find stream/endstream pairs and extract text
  const streamRe = /stream\r?\n/g
  let match
  while ((match = streamRe.exec(raw)) !== null) {
    const contentStart = match.index + match[0].length
    const endIdx = raw.indexOf('endstream', contentStart)
    if (endIdx === -1 || endIdx - contentStart > 5_000_000) continue

    const beforeStream = raw.substring(Math.max(0, match.index - 300), match.index)
    const isFlate = beforeStream.includes('/FlateDecode')
    const streamBytes = bytes.slice(contentStart, endIdx)

    let content = ''
    if (isFlate && streamBytes.length > 2) {
      // Try zlib (deflate with header), then raw deflate
      for (const fmt of ['deflate', 'deflate-raw']) {
        try { content = await decompressStream(streamBytes, fmt); break }
        catch { /* try next */ }
      }
    } else {
      content = new TextDecoder('latin1').decode(streamBytes)
    }

    if (content) {
      const text = extractTextOperators(content)
      if (text && text.trim().length > 2) extractedParts.push(text.trim())
    }
  }

  let result = extractedParts.join('\n')

  // Fallback: extract readable ASCII strings from raw PDF if streams yielded little
  if (result.length < 200) {
    const fallbackParts = []
    const asciiRe = /\(([^)\\]{3,}(?:\\.[^)\\]*)*)\)/g
    while ((match = asciiRe.exec(raw)) !== null) {
      const decoded = decodePDFString(match[1])
      if (/[a-zA-Z]{2,}/.test(decoded)) fallbackParts.push(decoded)
    }
    if (fallbackParts.join(' ').length > result.length) result = fallbackParts.join(' ')
  }

  return result.replace(/\s+/g, ' ').trim()
}

const EXTRACTION_PROMPT = `You are analyzing a brand guide PDF for a creative consultancy. Extract the following information and return ONLY valid JSON with no other text. If a field is not found in the document, use null.

{
  "company_name": "string",
  "industry": "string",
  "tagline": "string - the primary tagline or slogan",
  "mission": "string",
  "target_audience": "string",
  "strategic_tasks": "string",
  "founder_story": "string - any founder letter or origin story",
  "brand_narrative": "string - the main brand story",
  "metaphors": [{"name": "string", "description": "string"}],
  "brand_values": [{"name": "string", "tagline": "string", "narrative": "string"}],
  "archetypes": [{"name": "string", "description": "string"}],
  "messaging_pillars": [{"pillar_name": "string", "phrases": ["string"]}],
  "colours_primary": [{"name": "string", "hex": "string", "pantone": "string or empty"}],
  "colours_secondary": [{"name": "string", "hex": "string", "pantone": "string or empty"}],
  "typography": [{"role": "string", "font_family": "string", "weight": "string", "tracking": "string", "case_rule": "string"}],
  "imagery_guidelines": {"backgrounds": ["string"], "notes": "string", "template_descriptions": ["string"]},
  "voice_tone": "string",
  "dos": "string",
  "donts": "string"
}

Here is the brand guide text:
`

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

  // --- POST /brand-profiles/:clientId/extract ---
  const extractMatch = path.match(/^\/brand-profiles\/([^\/]+)\/extract$/)
  if (extractMatch && method === 'POST') {
    const clientId = extractMatch[1]
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)

    try {
      const formData = await request.formData()
      const file = formData.get('file')
      if (!file) return jsonResponse({ success: false, error: 'No PDF file provided' }, 400)

      const arrayBuffer = await file.arrayBuffer()

      // Upload PDF to R2
      const r2Path = `brand-guides/${clientId}/brand-guide.pdf`
      await env.tacklebox_storage.put(r2Path, arrayBuffer, {
        httpMetadata: { contentType: 'application/pdf' },
      })

      // Extract text from PDF
      let pdfText = ''
      try {
        pdfText = await extractTextFromPDF(arrayBuffer)
      } catch (err) {
        console.error('PDF text extraction error:', err)
        return jsonResponse({ success: false, error: 'Failed to extract text from PDF. The file may be scanned or image-based.' }, 422)
      }

      if (!pdfText || pdfText.length < 50) {
        return jsonResponse({ success: false, error: 'Could not extract enough text from the PDF. It may be scanned or image-based.' }, 422)
      }

      // Truncate if too long for the AI model context
      const maxChars = 12000
      const truncatedText = pdfText.length > maxChars ? pdfText.substring(0, maxChars) + '...' : pdfText

      // Send to Workers AI
      const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'You extract structured brand information from documents. Return ONLY valid JSON, no markdown, no explanation.' },
          { role: 'user', content: EXTRACTION_PROMPT + truncatedText },
        ],
        max_tokens: 4000,
      })

      const aiText = (aiResponse.response || '').trim()

      // Parse AI response — find JSON object in response
      let extracted = null
      try {
        // Try direct parse first
        extracted = JSON.parse(aiText)
      } catch {
        // Try to find JSON in the response
        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try { extracted = JSON.parse(jsonMatch[0]) }
          catch { /* fall through */ }
        }
      }

      if (!extracted) {
        return jsonResponse({
          success: false,
          error: 'AI could not extract structured data. Try a different PDF or fill in the profile manually.',
          raw_response: aiText.substring(0, 500),
        }, 422)
      }

      // Map extracted data to our field names and include the R2 path
      const result = {
        industry: extracted.industry || null,
        tagline: extracted.tagline || null,
        mission_statement: extracted.mission || null,
        target_audience: extracted.target_audience || null,
        strategic_tasks: extracted.strategic_tasks || null,
        founder_story: extracted.founder_story || null,
        brand_narrative: extracted.brand_narrative || null,
        metaphors: Array.isArray(extracted.metaphors) ? extracted.metaphors : null,
        brand_values: Array.isArray(extracted.brand_values) ? extracted.brand_values : null,
        archetypes: Array.isArray(extracted.archetypes) ? extracted.archetypes : null,
        messaging_pillars: Array.isArray(extracted.messaging_pillars) ? extracted.messaging_pillars : null,
        colours_primary: Array.isArray(extracted.colours_primary) ? extracted.colours_primary : null,
        colours_secondary: Array.isArray(extracted.colours_secondary) ? extracted.colours_secondary : null,
        typography: Array.isArray(extracted.typography) ? extracted.typography : null,
        imagery_guidelines: extracted.imagery_guidelines || null,
        voice_tone: extracted.voice_tone || null,
        dos: extracted.dos || null,
        donts: extracted.donts || null,
        brand_guide_path: r2Path,
        _company_name: extracted.company_name || null,
      }

      return jsonResponse({ success: true, data: result })
    } catch (err) {
      console.error('Brand profile extract error:', err)
      return jsonResponse({ success: false, error: 'Extraction failed: ' + (err.message || 'Unknown error') }, 500)
    }
  }

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

  // --- GET /brand-profiles (list for contractors — brand profiles for assigned clients) ---
  if (path === '/brand-profiles' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)

    try {
      let results = []
      if (auth.user.role === 'admin') {
        const q = await env.DB.prepare(`
          SELECT bp.*, u.display_name as client_name, u.company as client_company
          FROM brand_profiles bp
          LEFT JOIN users u ON bp.client_id = u.id
          ORDER BY bp.updated_at DESC
        `).all()
        results = q.results
      } else if (auth.user.role === 'contractor') {
        const q = await env.DB.prepare(`
          SELECT DISTINCT bp.*, u.display_name as client_name, u.company as client_company
          FROM brand_profiles bp
          JOIN tasks t ON bp.client_id = t.client_id
          LEFT JOIN users u ON bp.client_id = u.id
          WHERE t.contractor_id = ?
          ORDER BY bp.updated_at DESC
        `).bind(auth.user.id).all()
        results = q.results
      } else if (auth.user.role === 'client') {
        const q = await env.DB.prepare(`
          SELECT bp.*, u.display_name as client_name, u.company as client_company
          FROM brand_profiles bp
          LEFT JOIN users u ON bp.client_id = u.id
          WHERE bp.client_id = ?
        `).bind(auth.user.id).all()
        results = q.results
      }

      for (const profile of results) parseJsonFields(profile)

      return jsonResponse({ success: true, data: results })
    } catch (err) {
      console.error('List brand profiles error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch brand profiles' }, 500)
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
