/**
 * User Routes
 * GET /users - list all users (admin only)
 * GET /users/:id - get single user (admin or self)
 * POST /users - create user (admin only)
 * PUT /users/:id - update user (admin or self)
 * PATCH /users/:id/deactivate - deactivate user (admin only)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { hashPassword } from './auth.js'

export async function handleUsers(request, env, auth, path, method) {
  // GET /users - list all users with optional role filter
  if (path === '/users' && method === 'GET') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const url = new URL(request.url)
      const roleFilter = url.searchParams.get('role')

      let query = `SELECT u.id, u.email, u.role, u.display_name, u.company, u.avatar_url, u.is_active, u.created_at,
        cx.total_xp, cx.current_level, cx.tasks_completed,
        xl.name as level_name
        FROM users u
        LEFT JOIN contractor_xp cx ON u.id = cx.user_id
        LEFT JOIN xp_levels xl ON cx.current_level = xl.level`
      const bindings = []

      if (roleFilter) {
        query += ' WHERE u.role = ?'
        bindings.push(roleFilter)
      }

      query += ' ORDER BY u.created_at DESC'

      const stmt = env.DB.prepare(query)
      const result = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('List users error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch users' },
        500
      )
    }
  }

  // GET /users/:id - get single user
  const getUserMatch = path.match(/^\/users\/([^\/]+)$/)
  if (getUserMatch && method === 'GET') {
    const userId = getUserMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    // Admin can see any user, others can only see themselves
    if (auth.user.role !== 'admin' && auth.user.id !== userId) {
      return jsonResponse(
        { success: false, error: 'Insufficient permissions' },
        403
      )
    }

    try {
      const user = await env.DB.prepare(
        'SELECT id, email, role, display_name, company, avatar_url, is_active, has_completed_onboarding, storage_used_bytes, created_at, updated_at FROM users WHERE id = ?'
      ).bind(userId).first()

      if (!user) {
        return jsonResponse(
          { success: false, error: 'User not found' },
          404
        )
      }

      return jsonResponse({
        success: true,
        data: user,
      })
    } catch (err) {
      console.error('Get user error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch user' },
        500
      )
    }
  }

  // POST /users - create user (admin only)
  if (path === '/users' && method === 'POST') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const body = await request.json()
      const { email, password, role, display_name, company } = body

      if (!email || !password || !role || !display_name) {
        return jsonResponse(
          { success: false, error: 'Missing required fields: email, password, role, display_name' },
          400
        )
      }

      // Validate role
      if (!['client', 'contractor', 'admin'].includes(role)) {
        return jsonResponse(
          { success: false, error: 'Invalid role' },
          400
        )
      }

      // Check if email already exists
      const existing = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(email).first()

      if (existing) {
        return jsonResponse(
          { success: false, error: 'Email already exists' },
          400
        )
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password)
      const userId = crypto.randomUUID()

      await env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, role, display_name, company, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).bind(userId, email, passwordHash, role, display_name, company || null).run()

      const newUser = await env.DB.prepare(
        'SELECT id, email, role, display_name, company, avatar_url, is_active, created_at FROM users WHERE id = ?'
      ).bind(userId).first()

      return jsonResponse(
        {
          success: true,
          data: newUser,
        },
        201
      )
    } catch (err) {
      console.error('Create user error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to create user' },
        500
      )
    }
  }

  // PUT /users/:id - update user
  const updateMatch = path.match(/^\/users\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const userId = updateMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    // Admin can update anyone, users can only update themselves
    const isAdmin = auth.user.role === 'admin'
    const isSelf = auth.user.id === userId

    if (!isAdmin && !isSelf) {
      return jsonResponse(
        { success: false, error: 'Insufficient permissions' },
        403
      )
    }

    try {
      const body = await request.json()

      // Non-admin users can only update display_name, company, and avatar_url
      if (!isAdmin) {
        const allowedFields = ['display_name', 'company', 'avatar_url']
        const requestedFields = Object.keys(body)
        const invalidFields = requestedFields.filter(f => !allowedFields.includes(f))

        if (invalidFields.length > 0) {
          return jsonResponse(
            { success: false, error: 'You can only update display_name and avatar_url' },
            403
          )
        }
      }

      // Build update query
      const updates = []
      const bindings = []

      if (body.display_name !== undefined) {
        updates.push('display_name = ?')
        bindings.push(body.display_name)
      }
      if (body.avatar_url !== undefined) {
        updates.push('avatar_url = ?')
        bindings.push(body.avatar_url)
      }
      if (body.company !== undefined) {
        updates.push('company = ?')
        bindings.push(body.company)
      }

      // Admin-only fields
      if (isAdmin) {
        if (body.email !== undefined) {
          updates.push('email = ?')
          bindings.push(body.email)
        }
        if (body.role !== undefined) {
          if (!['client', 'contractor', 'admin'].includes(body.role)) {
            return jsonResponse(
              { success: false, error: 'Invalid role' },
              400
            )
          }
          updates.push('role = ?')
          bindings.push(body.role)
        }
        if (body.is_active !== undefined) {
          updates.push('is_active = ?')
          bindings.push(body.is_active ? 1 : 0)
        }
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: 'No fields to update' },
          400
        )
      }

      updates.push('updated_at = datetime("now")')
      bindings.push(userId)

      await env.DB.prepare(`
        UPDATE users SET ${updates.join(', ')} WHERE id = ?
      `).bind(...bindings).run()

      const updatedUser = await env.DB.prepare(
        'SELECT id, email, role, display_name, company, avatar_url, is_active, created_at, updated_at FROM users WHERE id = ?'
      ).bind(userId).first()

      return jsonResponse({
        success: true,
        data: updatedUser,
      })
    } catch (err) {
      console.error('Update user error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to update user' },
        500
      )
    }
  }

  // PATCH /users/:id/deactivate - deactivate user (admin only)
  const deactivateMatch = path.match(/^\/users\/([^\/]+)\/deactivate$/)
  if (deactivateMatch && method === 'PATCH') {
    const userId = deactivateMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      await env.DB.prepare(
        'UPDATE users SET is_active = 0, updated_at = datetime("now") WHERE id = ?'
      ).bind(userId).run()

      return jsonResponse({
        success: true,
        data: { id: userId, is_active: false },
      })
    } catch (err) {
      console.error('Deactivate user error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to deactivate user' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
