/**
 * Project Routes
 * GET /projects - list projects (role-filtered)
 * GET /projects/:id - get single project
 * POST /projects - create project
 * PUT /projects/:id - update project (admin only)
 * GET /projects/:id/tasks - list tasks in project
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export async function handleProjects(request, env, auth, path, method) {
  // GET /projects - list projects
  if (path === '/projects' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const url = new URL(request.url)
      const statusFilter = url.searchParams.get('status')

      let query = `
        SELECT p.*,
          u.display_name as client_name,
          u.email as client_email
        FROM projects p
        LEFT JOIN users u ON p.client_id = u.id
      `
      const conditions = []
      const bindings = []

      // Role-based filtering
      if (auth.user.role === 'client') {
        conditions.push('p.client_id = ?')
        bindings.push(auth.user.id)
      } else if (auth.user.role === 'contractor') {
        conditions.push('p.client_id IN (SELECT DISTINCT client_id FROM tasks WHERE contractor_id = ?)')
        bindings.push(auth.user.id)
      }
      // Admin sees all projects

      if (statusFilter) {
        conditions.push('p.status = ?')
        bindings.push(statusFilter)
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }

      query += ' ORDER BY p.created_at DESC'

      const stmt = env.DB.prepare(query)
      const result = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('List projects error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch projects' },
        500
      )
    }
  }

  // GET /projects/:id - get single project
  const getMatch = path.match(/^\/projects\/([^\/]+)$/)
  if (getMatch && method === 'GET') {
    const projectId = getMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const project = await env.DB.prepare(`
        SELECT p.*,
          u.display_name as client_name,
          u.email as client_email
        FROM projects p
        LEFT JOIN users u ON p.client_id = u.id
        WHERE p.id = ?
      `).bind(projectId).first()

      if (!project) {
        return jsonResponse(
          { success: false, error: 'Project not found' },
          404
        )
      }

      // Check permissions: admin or owning client
      if (auth.user.role !== 'admin' && project.client_id !== auth.user.id) {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      return jsonResponse({
        success: true,
        data: project,
      })
    } catch (err) {
      console.error('Get project error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch project' },
        500
      )
    }
  }

  // POST /projects - create project
  if (path === '/projects' && method === 'POST') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    // Only admin and client can create projects
    if (!['admin', 'client'].includes(auth.user.role)) {
      return jsonResponse(
        { success: false, error: 'Insufficient permissions' },
        403
      )
    }

    try {
      const body = await request.json()
      const { name, description, client_id, status } = body

      if (!name) {
        return jsonResponse(
          { success: false, error: 'Project name is required' },
          400
        )
      }

      // Determine client_id
      let finalClientId
      if (auth.user.role === 'client') {
        // Clients can only create projects for themselves
        finalClientId = auth.user.id
      } else if (auth.user.role === 'admin') {
        // Admin must provide client_id
        if (!client_id) {
          return jsonResponse(
            { success: false, error: 'client_id is required for admin' },
            400
          )
        }
        finalClientId = client_id

        // Verify client exists
        const clientExists = await env.DB.prepare(
          'SELECT id FROM users WHERE id = ? AND role = "client"'
        ).bind(finalClientId).first()

        if (!clientExists) {
          return jsonResponse(
            { success: false, error: 'Invalid client_id' },
            400
          )
        }
      }

      const projectId = crypto.randomUUID()
      const projectStatus = status || 'active'

      await env.DB.prepare(`
        INSERT INTO projects (id, name, description, client_id, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        projectId,
        name,
        description || null,
        finalClientId,
        projectStatus,
        auth.user.id
      ).run()

      const newProject = await env.DB.prepare(`
        SELECT p.*,
          u.display_name as client_name,
          u.email as client_email
        FROM projects p
        LEFT JOIN users u ON p.client_id = u.id
        WHERE p.id = ?
      `).bind(projectId).first()

      return jsonResponse(
        {
          success: true,
          data: newProject,
        },
        201
      )
    } catch (err) {
      console.error('Create project error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to create project' },
        500
      )
    }
  }

  // PUT /projects/:id - update project (admin only)
  const updateMatch = path.match(/^\/projects\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const projectId = updateMatch[1]

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
      if (body.status !== undefined) {
        if (!['active', 'on_hold', 'completed', 'archived'].includes(body.status)) {
          return jsonResponse(
            { success: false, error: 'Invalid status' },
            400
          )
        }
        updates.push('status = ?')
        bindings.push(body.status)
      }
      if (body.client_id !== undefined) {
        // Verify client exists
        const clientExists = await env.DB.prepare(
          'SELECT id FROM users WHERE id = ? AND role = "client"'
        ).bind(body.client_id).first()

        if (!clientExists) {
          return jsonResponse(
            { success: false, error: 'Invalid client_id' },
            400
          )
        }
        updates.push('client_id = ?')
        bindings.push(body.client_id)
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: 'No fields to update' },
          400
        )
      }

      updates.push('updated_at = datetime("now")')
      bindings.push(projectId)

      await env.DB.prepare(`
        UPDATE projects SET ${updates.join(', ')} WHERE id = ?
      `).bind(...bindings).run()

      const updatedProject = await env.DB.prepare(`
        SELECT p.*,
          u.display_name as client_name,
          u.email as client_email
        FROM projects p
        LEFT JOIN users u ON p.client_id = u.id
        WHERE p.id = ?
      `).bind(projectId).first()

      if (!updatedProject) {
        return jsonResponse(
          { success: false, error: 'Project not found' },
          404
        )
      }

      return jsonResponse({
        success: true,
        data: updatedProject,
      })
    } catch (err) {
      console.error('Update project error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to update project' },
        500
      )
    }
  }

  // GET /projects/:id/tasks - list tasks in project
  const tasksMatch = path.match(/^\/projects\/([^\/]+)\/tasks$/)
  if (tasksMatch && method === 'GET') {
    const projectId = tasksMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // First check if project exists and user has access
      const project = await env.DB.prepare(
        'SELECT id, client_id FROM projects WHERE id = ?'
      ).bind(projectId).first()

      if (!project) {
        return jsonResponse(
          { success: false, error: 'Project not found' },
          404
        )
      }

      // Check permissions
      if (auth.user.role !== 'admin' && project.client_id !== auth.user.id) {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      // Fetch tasks
      let query = `
        SELECT t.*,
          c.display_name as client_name,
          con.display_name as contractor_name,
          cat.name as category_name
        FROM tasks t
        LEFT JOIN users c ON t.client_id = c.id
        LEFT JOIN users con ON t.contractor_id = con.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        WHERE t.project_id = ?
      `
      const bindings = [projectId]

      // Apply role-based filtering
      if (auth.user.role === 'client') {
        query += ' AND t.client_id = ?'
        bindings.push(auth.user.id)
      } else if (auth.user.role === 'contractor') {
        query += ' AND t.contractor_id = ?'
        bindings.push(auth.user.id)
      }

      query += ' ORDER BY t.created_at DESC'

      const result = await env.DB.prepare(query).bind(...bindings).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('Get project tasks error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch project tasks' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
