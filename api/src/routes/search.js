/**
 * Search Routes — Global search across entities
 * GET /search?q=...&type=... - search tasks, users, projects, brand_guides
 *
 * Role-scoped results:
 * - Admin: everything
 * - Client: own tasks, own projects, own user only
 * - Contractor: assigned tasks, accessible brand guides, own user only
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'

export async function handleSearch(request, env, auth, path, method) {
  // GET /search?q=...&type=...
  if (path === '/search' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const url = new URL(request.url)
      const query = url.searchParams.get('q')
      const type = url.searchParams.get('type')

      if (!query || query.trim().length < 2) {
        return jsonResponse(
          { success: false, error: 'Search query must be at least 2 characters' },
          400
        )
      }

      const validTypes = ['tasks', 'users', 'projects', 'brand_guides']
      if (type && !validTypes.includes(type)) {
        return jsonResponse(
          { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          400
        )
      }

      const searchPattern = `%${query.trim()}%`
      const role = auth.user.role
      const userId = auth.user.id

      const results = {
        tasks: [],
        users: [],
        projects: [],
        brand_guides: [],
      }

      // Search tasks
      if (!type || type === 'tasks') {
        let taskQuery = `
          SELECT t.id, t.title, t.description, t.status, t.priority,
            t.created_at, cat.name as category_name,
            c.display_name as client_name,
            con.display_name as contractor_name
          FROM tasks t
          LEFT JOIN task_categories cat ON t.category_id = cat.id
          LEFT JOIN users c ON t.client_id = c.id
          LEFT JOIN users con ON t.contractor_id = con.id
          WHERE (t.title LIKE ? OR t.description LIKE ?)
        `
        const taskBindings = [searchPattern, searchPattern]

        if (role === 'client') {
          taskQuery += ' AND t.client_id = ?'
          taskBindings.push(userId)
        } else if (role === 'contractor') {
          taskQuery += ' AND t.contractor_id = ?'
          taskBindings.push(userId)
        }
        // Admin sees all tasks

        taskQuery += ' ORDER BY t.created_at DESC LIMIT 10'

        const taskResult = await env.DB.prepare(taskQuery).bind(...taskBindings).all()
        results.tasks = taskResult.results || []
      }

      // Search users
      if (!type || type === 'users') {
        if (role === 'admin') {
          const userResult = await env.DB.prepare(`
            SELECT id, display_name, email, role, company, avatar_url
            FROM users
            WHERE (display_name LIKE ? OR email LIKE ? OR company LIKE ?)
              AND is_active = 1
            ORDER BY display_name ASC
            LIMIT 10
          `).bind(searchPattern, searchPattern, searchPattern).all()
          results.users = userResult.results || []
        } else {
          // Client and contractor can only see their own user
          const userResult = await env.DB.prepare(`
            SELECT id, display_name, email, role, company, avatar_url
            FROM users
            WHERE id = ?
              AND (display_name LIKE ? OR email LIKE ?)
              AND is_active = 1
            LIMIT 10
          `).bind(userId, searchPattern, searchPattern).all()
          results.users = userResult.results || []
        }
      }

      // Search projects
      if (!type || type === 'projects') {
        let projectQuery = `
          SELECT p.id, p.name, p.description, p.status, p.created_at,
            u.display_name as client_name
          FROM projects p
          LEFT JOIN users u ON p.client_id = u.id
          WHERE (p.name LIKE ? OR p.description LIKE ?)
        `
        const projectBindings = [searchPattern, searchPattern]

        if (role === 'client') {
          projectQuery += ' AND p.client_id = ?'
          projectBindings.push(userId)
        } else if (role === 'contractor') {
          // Contractors don't get project search results
          // (they access tasks directly, not projects)
          projectQuery += ' AND 1 = 0'
        }
        // Admin sees all projects

        projectQuery += ' ORDER BY p.created_at DESC LIMIT 10'

        const projectResult = await env.DB.prepare(projectQuery).bind(...projectBindings).all()
        results.projects = projectResult.results || []
      }

      // Search brand guides
      if (!type || type === 'brand_guides') {
        let guideQuery = `
          SELECT bg.id, bg.title, bg.file_type, bg.created_at,
            u.display_name as client_name
          FROM brand_guides bg
          LEFT JOIN users u ON bg.client_id = u.id
          WHERE bg.title LIKE ?
        `
        const guideBindings = [searchPattern]

        if (role === 'client') {
          // Clients don't typically search brand guides (they see their own via brand-guides route)
          guideQuery += ' AND bg.client_id = ?'
          guideBindings.push(userId)
        } else if (role === 'contractor') {
          // Contractor can see guides for clients whose tasks they're assigned to
          guideQuery += ' AND bg.client_id IN (SELECT DISTINCT client_id FROM tasks WHERE contractor_id = ?)'
          guideBindings.push(userId)
        }
        // Admin sees all brand guides

        guideQuery += ' ORDER BY bg.created_at DESC LIMIT 10'

        const guideResult = await env.DB.prepare(guideQuery).bind(...guideBindings).all()
        results.brand_guides = guideResult.results || []
      }

      return jsonResponse({
        success: true,
        data: {
          ...results,
          counts: {
            tasks: results.tasks.length,
            users: results.users.length,
            projects: results.projects.length,
            brand_guides: results.brand_guides.length,
          },
        },
      })
    } catch (err) {
      console.error('Search error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to perform search' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
