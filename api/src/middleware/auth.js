/**
 * Auth Middleware — Placeholder for Phase 1
 *
 * Phase 1: Extracts user from token/header for role-based access.
 * Phase 2: Will validate real JWT/OAuth tokens.
 *
 * Behind service abstraction — swap provider without touching route logic.
 */

export async function authenticate(request, env) {
  // Phase 1: Placeholder auth
  // Expects Authorization header with a test user ID
  // In Phase 2, this will validate real tokens
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) {
    return { authenticated: false, user: null }
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Phase 1: Look up user by ID from token
    const user = await env.DB.prepare(
      'SELECT id, email, role, display_name, company, avatar_url, is_active FROM users WHERE id = ? AND is_active = 1'
    ).bind(token).first()

    if (!user) {
      return { authenticated: false, user: null }
    }

    return { authenticated: true, user }
  } catch (err) {
    console.error('Auth error:', err)
    return { authenticated: false, user: null }
  }
}

export function requireAuth(authResult) {
  if (!authResult.authenticated) {
    return { authorized: false, status: 401, error: 'Authentication required' }
  }
  return { authorized: true }
}

export function requireRole(authResult, ...roles) {
  const authCheck = requireAuth(authResult)
  if (!authCheck.authorized) return authCheck

  if (!roles.includes(authResult.user.role)) {
    return { authorized: false, status: 403, error: 'Insufficient permissions' }
  }
  return { authorized: true }
}
