/**
 * Auth Routes
 * POST /auth/login
 * POST /auth/register
 */

import { jsonResponse } from '../index.js'

// Phase 1 placeholder: SHA-256 hash for password storage
export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password, hash) {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

export async function handleAuth(request, env, path, method) {
  // POST /auth/login
  if (path === '/auth/login' && method === 'POST') {
    try {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return jsonResponse(
          { success: false, error: 'Email and password are required' },
          400
        )
      }

      // Look up user by email
      const user = await env.DB.prepare(
        'SELECT id, email, password_hash, role, display_name, company, avatar_url, is_active FROM users WHERE email = ?'
      ).bind(email).first()

      if (!user || user.is_active === 0) {
        return jsonResponse(
          { success: false, error: 'Invalid credentials' },
          401
        )
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password_hash)
      if (!isValid) {
        return jsonResponse(
          { success: false, error: 'Invalid credentials' },
          401
        )
      }

      // Fetch level data for non-client users
      let level = 1
      let levelName = 'Volunteer'
      if (user.role !== 'client') {
        const xp = await env.DB.prepare(
          'SELECT current_level FROM contractor_xp WHERE user_id = ?'
        ).bind(user.id).first()
        level = xp?.current_level || 1
        // For admin role, ensure minimum level 7
        if (user.role === 'admin' && level < 7) level = 7
        const levelInfo = await env.DB.prepare(
          'SELECT name FROM xp_levels WHERE level = ?'
        ).bind(level).first()
        levelName = levelInfo?.name || 'Volunteer'
      }

      // Phase 1: Return user ID as token
      return jsonResponse({
        success: true,
        data: {
          token: user.id,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            display_name: user.display_name,
            company: user.company,
            avatar_url: user.avatar_url,
            level,
            level_name: levelName,
          },
        },
      })
    } catch (err) {
      console.error('Login error:', err)
      return jsonResponse(
        { success: false, error: 'Login failed' },
        500
      )
    }
  }

  // POST /auth/register - admin only (handled in users.js, but can be called here too)
  if (path === '/auth/register' && method === 'POST') {
    try {
      // This is admin-only - check auth
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return jsonResponse(
          { success: false, error: 'Authentication required' },
          401
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const admin = await env.DB.prepare(
        'SELECT role FROM users WHERE id = ? AND is_active = 1'
      ).bind(token).first()

      if (!admin || admin.role !== 'admin') {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      const body = await request.json()
      const { email, password, role, display_name, company } = body

      if (!email || !password || !role || !display_name) {
        return jsonResponse(
          { success: false, error: 'Missing required fields' },
          400
        )
      }

      const VALID_ROLES = ['client', 'contractor', 'admin']
      if (!VALID_ROLES.includes(role)) {
        return jsonResponse(
          { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
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
        INSERT INTO users (id, email, password_hash, role, display_name, company)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(userId, email, passwordHash, role, display_name, company || null).run()

      return jsonResponse(
        {
          success: true,
          data: { id: userId, email, role, display_name, company },
        },
        201
      )
    } catch (err) {
      console.error('Register error:', err)
      return jsonResponse(
        { success: false, error: 'Registration failed' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
