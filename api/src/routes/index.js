/**
 * API Router
 *
 * All routes under /api/v1/
 * Each resource gets its own route file.
 */

import { jsonResponse } from '../index.js'

export async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/v1', '')
  const method = request.method

  // Health check
  if (path === '/health' && method === 'GET') {
    return jsonResponse({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      },
    })
  }

  // Route handlers will be added in Phase 1B+
  // Example structure:
  // if (path.startsWith('/users')) return handleUsers(request, env, path, method)
  // if (path.startsWith('/tasks')) return handleTasks(request, env, path, method)
  // if (path.startsWith('/projects')) return handleProjects(request, env, path, method)

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
