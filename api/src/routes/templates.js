/**
 * Template Routes
 * GET /templates - list templates
 * GET /templates/:id - get single template
 * POST /templates - create template (admin only)
 * PUT /templates/:id - update template (admin only)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export async function handleTemplates(request, env, auth, path, method) {
  // GET /templates - list templates
  if (path === '/templates' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const url = new URL(request.url)
      const categoryId = url.searchParams.get('category_id')

      let query = `
        SELECT t.*,
          c.name as category_name
        FROM task_templates t
        LEFT JOIN task_categories c ON t.category_id = c.id
        WHERE t.is_active = 1
      `
      const bindings = []

      if (categoryId) {
        query += ' AND t.category_id = ?'
        bindings.push(categoryId)
      }

      query += ' ORDER BY t.name ASC'

      const stmt = env.DB.prepare(query)
      const result = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('List templates error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch templates' },
        500
      )
    }
  }

  // GET /templates/:id - get single template
  const getMatch = path.match(/^\/templates\/([^\/]+)$/)
  if (getMatch && method === 'GET') {
    const templateId = getMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const template = await env.DB.prepare(`
        SELECT t.*,
          c.name as category_name
        FROM task_templates t
        LEFT JOIN task_categories c ON t.category_id = c.id
        WHERE t.id = ?
      `).bind(templateId).first()

      if (!template) {
        return jsonResponse(
          { success: false, error: 'Template not found' },
          404
        )
      }

      return jsonResponse({
        success: true,
        data: template,
      })
    } catch (err) {
      console.error('Get template error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch template' },
        500
      )
    }
  }

  // POST /templates - create template (admin only)
  if (path === '/templates' && method === 'POST') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const body = await request.json()
      const { name, category_id, default_title, default_description, default_priority, checklist } = body

      if (!name || !category_id) {
        return jsonResponse(
          { success: false, error: 'name and category_id are required' },
          400
        )
      }

      // Verify category exists
      const categoryExists = await env.DB.prepare(
        'SELECT id FROM task_categories WHERE id = ?'
      ).bind(category_id).first()

      if (!categoryExists) {
        return jsonResponse(
          { success: false, error: 'Invalid category_id' },
          400
        )
      }

      // Validate priority if provided
      if (default_priority && !['low', 'medium', 'high', 'urgent'].includes(default_priority)) {
        return jsonResponse(
          { success: false, error: 'Invalid default_priority' },
          400
        )
      }

      const templateId = crypto.randomUUID()

      // Serialize checklist if it's an array
      const checklistJson = checklist ? JSON.stringify(checklist) : null

      await env.DB.prepare(`
        INSERT INTO task_templates (id, name, category_id, default_title, default_description, default_priority, checklist, created_by, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(
        templateId,
        name,
        category_id,
        default_title || null,
        default_description || null,
        default_priority || null,
        checklistJson,
        auth.user.id
      ).run()

      const newTemplate = await env.DB.prepare(`
        SELECT t.*,
          c.name as category_name
        FROM task_templates t
        LEFT JOIN task_categories c ON t.category_id = c.id
        WHERE t.id = ?
      `).bind(templateId).first()

      return jsonResponse(
        {
          success: true,
          data: newTemplate,
        },
        201
      )
    } catch (err) {
      console.error('Create template error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to create template' },
        500
      )
    }
  }

  // PUT /templates/:id - update template (admin only)
  const updateMatch = path.match(/^\/templates\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const templateId = updateMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const body = await request.json()

      const updates = []
      const bindings = []

      if (body.name !== undefined) {
        updates.push('name = ?')
        bindings.push(body.name)
      }
      if (body.category_id !== undefined) {
        // Verify category exists
        const categoryExists = await env.DB.prepare(
          'SELECT id FROM task_categories WHERE id = ?'
        ).bind(body.category_id).first()

        if (!categoryExists) {
          return jsonResponse(
            { success: false, error: 'Invalid category_id' },
            400
          )
        }
        updates.push('category_id = ?')
        bindings.push(body.category_id)
      }
      if (body.default_title !== undefined) {
        updates.push('default_title = ?')
        bindings.push(body.default_title)
      }
      if (body.default_description !== undefined) {
        updates.push('default_description = ?')
        bindings.push(body.default_description)
      }
      if (body.default_priority !== undefined) {
        if (body.default_priority && !['low', 'medium', 'high', 'urgent'].includes(body.default_priority)) {
          return jsonResponse(
            { success: false, error: 'Invalid default_priority' },
            400
          )
        }
        updates.push('default_priority = ?')
        bindings.push(body.default_priority)
      }
      if (body.checklist !== undefined) {
        updates.push('checklist = ?')
        bindings.push(body.checklist ? JSON.stringify(body.checklist) : null)
      }
      if (body.is_active !== undefined) {
        updates.push('is_active = ?')
        bindings.push(body.is_active ? 1 : 0)
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: 'No fields to update' },
          400
        )
      }

      bindings.push(templateId)

      await env.DB.prepare(`
        UPDATE task_templates SET ${updates.join(', ')} WHERE id = ?
      `).bind(...bindings).run()

      const updatedTemplate = await env.DB.prepare(`
        SELECT t.*,
          c.name as category_name
        FROM task_templates t
        LEFT JOIN task_categories c ON t.category_id = c.id
        WHERE t.id = ?
      `).bind(templateId).first()

      if (!updatedTemplate) {
        return jsonResponse(
          { success: false, error: 'Template not found' },
          404
        )
      }

      return jsonResponse({
        success: true,
        data: updatedTemplate,
      })
    } catch (err) {
      console.error('Update template error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to update template' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
