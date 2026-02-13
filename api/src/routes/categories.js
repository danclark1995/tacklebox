/**
 * Category Routes
 * GET /categories - list categories
 * POST /categories - create category (admin only)
 * PUT /categories/:id - update category (admin only)
 * PATCH /categories/:id/deactivate - deactivate category (admin only)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export async function handleCategories(request, env, auth, path, method) {
  // GET /categories - list categories
  if (path === '/categories' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const url = new URL(request.url)
      const includeInactive = url.searchParams.get('include_inactive') === 'true'

      let query = 'SELECT * FROM task_categories'

      // Only admin can see inactive categories
      if (!includeInactive || auth.user.role !== 'admin') {
        query += ' WHERE is_active = 1'
      }

      query += ' ORDER BY name ASC'

      const result = await env.DB.prepare(query).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('List categories error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch categories' },
        500
      )
    }
  }

  // POST /categories - create category (admin only)
  if (path === '/categories' && method === 'POST') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const body = await request.json()
      const { name, description, default_priority, icon } = body

      if (!name) {
        return jsonResponse(
          { success: false, error: 'Category name is required' },
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

      const categoryId = crypto.randomUUID()

      await env.DB.prepare(`
        INSERT INTO task_categories (id, name, description, default_priority, icon, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(
        categoryId,
        name,
        description || null,
        default_priority || null,
        icon || null
      ).run()

      const newCategory = await env.DB.prepare(
        'SELECT * FROM task_categories WHERE id = ?'
      ).bind(categoryId).first()

      return jsonResponse(
        {
          success: true,
          data: newCategory,
        },
        201
      )
    } catch (err) {
      console.error('Create category error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to create category' },
        500
      )
    }
  }

  // PUT /categories/:id - update category (admin only)
  const updateMatch = path.match(/^\/categories\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const categoryId = updateMatch[1]

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
      if (body.description !== undefined) {
        updates.push('description = ?')
        bindings.push(body.description)
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
      if (body.icon !== undefined) {
        updates.push('icon = ?')
        bindings.push(body.icon)
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

      bindings.push(categoryId)

      await env.DB.prepare(`
        UPDATE task_categories SET ${updates.join(', ')} WHERE id = ?
      `).bind(...bindings).run()

      const updatedCategory = await env.DB.prepare(
        'SELECT * FROM task_categories WHERE id = ?'
      ).bind(categoryId).first()

      if (!updatedCategory) {
        return jsonResponse(
          { success: false, error: 'Category not found' },
          404
        )
      }

      return jsonResponse({
        success: true,
        data: updatedCategory,
      })
    } catch (err) {
      console.error('Update category error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to update category' },
        500
      )
    }
  }

  // PATCH /categories/:id/deactivate - deactivate category (admin only)
  const deactivateMatch = path.match(/^\/categories\/([^\/]+)\/deactivate$/)
  if (deactivateMatch && method === 'PATCH') {
    const categoryId = deactivateMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      await env.DB.prepare(
        'UPDATE task_categories SET is_active = 0 WHERE id = ?'
      ).bind(categoryId).run()

      return jsonResponse({
        success: true,
        data: { id: categoryId, is_active: false },
      })
    } catch (err) {
      console.error('Deactivate category error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to deactivate category' },
        500
      )
    }
  }

  // DELETE /categories/:id - delete category (admin only)
  const deleteMatch = path.match(/^\/categories\/([^\/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    const categoryId = deleteMatch[1]
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }
    const roleCheck = requireRole(auth, 'admin')
    if (!roleCheck.authorized) {
      return jsonResponse({ success: false, error: roleCheck.error }, roleCheck.status)
    }
    try {
      const category = await env.DB.prepare('SELECT id FROM task_categories WHERE id = ?').bind(categoryId).first()
      if (!category) {
        return jsonResponse({ success: false, error: 'Category not found' }, 404)
      }
      const taskCount = await env.DB.prepare('SELECT COUNT(*) as count FROM tasks WHERE category_id = ?').bind(categoryId).first()
      if (taskCount && taskCount.count > 0) {
        return jsonResponse({ success: false, error: `Cannot delete — ${taskCount.count} tasks use this category` }, 400)
      }
      await env.DB.prepare('DELETE FROM task_categories WHERE id = ?').bind(categoryId).run()
      return jsonResponse({ success: true })
    } catch (err) {
      console.error('Delete category error:', err)
      return jsonResponse({ success: false, error: 'Failed to delete category' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
