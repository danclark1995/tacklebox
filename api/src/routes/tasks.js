/**
 * Task Routes — State Machine Implementation
 * GET /tasks - list tasks (role-filtered)
 * GET /tasks/:id - get single task
 * POST /tasks - create task
 * PUT /tasks/:id - update task (non-status fields)
 * PATCH /tasks/:id/status - update task status (state machine)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { notifyTaskStatusChange } from '../services/notifications.js'

// Task state machine transitions
const TRANSITIONS = {
  submitted: {
    allowed: ['assigned', 'cancelled'],
    assigned: { roles: ['admin'], requires: ['contractor_id'] },
    cancelled: { roles: ['admin'] },
  },
  assigned: {
    allowed: ['in_progress', 'cancelled'],
    in_progress: { roles: ['contractor'] },
    cancelled: { roles: ['admin'] },
  },
  in_progress: {
    allowed: ['review', 'cancelled'],
    review: { roles: ['contractor'], validation: 'deliverables' },
    cancelled: { roles: ['admin'] },
  },
  review: {
    allowed: ['approved', 'revision'],
    approved: { roles: ['admin'] },
    revision: { roles: ['admin'], requires: ['note'] },
  },
  revision: {
    allowed: ['in_progress'],
    in_progress: { roles: ['contractor'] },
  },
  approved: {
    allowed: ['closed'],
    closed: { roles: ['admin'] },
  },
  closed: {
    allowed: [], // Terminal state
  },
  cancelled: {
    allowed: [], // Terminal state
  },
}

async function validateTransition(env, task, newStatus, transitionData, auth) {
  const currentStatus = task.status

  if (!TRANSITIONS[currentStatus]) {
    return { valid: false, error: `Invalid current status: ${currentStatus}` }
  }

  const transition = TRANSITIONS[currentStatus]

  if (!transition.allowed.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`,
    }
  }

  const rules = transition[newStatus]

  // Check role permissions
  if (rules.roles && !rules.roles.includes(auth.user.role)) {
    return {
      valid: false,
      error: `Only ${rules.roles.join(', ')} can perform this transition`,
    }
  }

  // Check contractor assignment
  if (auth.user.role === 'contractor') {
    if (task.contractor_id !== auth.user.id) {
      return {
        valid: false,
        error: 'You are not assigned to this task',
      }
    }
  }

  // Check required fields
  if (rules.requires) {
    for (const field of rules.requires) {
      if (!transitionData[field]) {
        return {
          valid: false,
          error: `${field} is required for this transition`,
        }
      }
    }
  }

  // Special validation: deliverables for in_progress → review
  if (currentStatus === 'in_progress' && newStatus === 'review') {
    const deliverables = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM task_attachments WHERE task_id = ? AND upload_type = "deliverable"'
    ).bind(task.id).first()

    if (deliverables.count === 0) {
      return {
        valid: false,
        error: 'At least one deliverable is required to submit for review',
      }
    }
  }

  return { valid: true }
}

export async function handleTasks(request, env, auth, path, method) {
  // GET /tasks/campfire - list claimable campfire tasks
  if (path === '/tasks/campfire' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }
    if (!['contractor', 'admin'].includes(auth.user.role)) {
      return jsonResponse({ success: false, error: 'Insufficient permissions' }, 403)
    }
    try {
      const result = await env.DB.prepare(`
        SELECT t.id, t.title, t.description, t.priority, t.complexity_level, t.created_at,
          cat.name as category_name,
          c.display_name as client_name
        FROM tasks t
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN users c ON t.client_id = c.id
        WHERE t.status = 'submitted'
          AND t.contractor_id IS NULL
          AND t.campfire_eligible = 1
        ORDER BY t.created_at DESC
      `).all()
      return jsonResponse({ success: true, data: result.results || [] })
    } catch (err) {
      console.error('Campfire list error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch campfire tasks' }, 500)
    }
  }

  // POST /tasks/:id/claim - contractor claims a campfire task
  const claimMatch = path.match(/^\/tasks\/([^\/]+)\/claim$/)
  if (claimMatch && method === 'POST') {
    const taskId = claimMatch[1]
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }
    if (auth.user.role !== 'contractor') {
      return jsonResponse({ success: false, error: 'Only campers can claim tasks' }, 403)
    }
    try {
      const task = await env.DB.prepare(
        'SELECT * FROM tasks WHERE id = ?'
      ).bind(taskId).first()
      if (!task) {
        return jsonResponse({ success: false, error: 'Task not found' }, 404)
      }
      if (task.campfire_eligible !== 1 || task.status !== 'submitted' || task.contractor_id) {
        return jsonResponse({ success: false, error: 'This task has already been claimed' }, 409)
      }
      await env.DB.prepare(`
        UPDATE tasks SET contractor_id = ?, status = 'assigned', updated_at = datetime("now") WHERE id = ?
      `).bind(auth.user.id, taskId).run()
      await env.DB.prepare(`
        INSERT INTO task_history (id, task_id, changed_by, from_status, to_status, note)
        VALUES (?, ?, ?, 'submitted', 'assigned', 'Claimed from campfire')
      `).bind(crypto.randomUUID(), taskId, auth.user.id).run()
      const updated = await env.DB.prepare(`
        SELECT t.*, c.display_name as client_name, con.display_name as contractor_name,
          cat.name as category_name, p.name as project_name
        FROM tasks t
        LEFT JOIN users c ON t.client_id = c.id
        LEFT JOIN users con ON t.contractor_id = con.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `).bind(taskId).first()
      return jsonResponse({ success: true, data: updated })
    } catch (err) {
      console.error('Claim task error:', err)
      return jsonResponse({ success: false, error: 'Failed to claim task' }, 500)
    }
  }

  // POST /tasks/:id/pass - contractor passes on an assigned task
  const passMatch = path.match(/^\/tasks\/([^\/]+)\/pass$/)
  if (passMatch && method === 'POST') {
    const taskId = passMatch[1]
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }
    if (auth.user.role !== 'contractor') {
      return jsonResponse({ success: false, error: 'Only campers can pass on tasks' }, 403)
    }
    try {
      const task = await env.DB.prepare(
        'SELECT * FROM tasks WHERE id = ?'
      ).bind(taskId).first()
      if (!task) {
        return jsonResponse({ success: false, error: 'Task not found' }, 404)
      }
      if (task.contractor_id !== auth.user.id) {
        return jsonResponse({ success: false, error: 'This task is not assigned to you' }, 403)
      }
      if (task.status !== 'assigned') {
        return jsonResponse({ success: false, error: 'You can only pass on tasks that have not been started' }, 400)
      }
      await env.DB.prepare(`
        UPDATE tasks SET contractor_id = NULL, status = 'submitted', campfire_eligible = 1, updated_at = datetime("now") WHERE id = ?
      `).bind(taskId).run()
      await env.DB.prepare(`
        INSERT INTO task_history (id, task_id, changed_by, from_status, to_status, note)
        VALUES (?, ?, ?, 'assigned', 'submitted', 'Passed — returned to campfire')
      `).bind(crypto.randomUUID(), taskId, auth.user.id).run()
      const updated = await env.DB.prepare(`
        SELECT t.*, c.display_name as client_name, con.display_name as contractor_name,
          cat.name as category_name, p.name as project_name
        FROM tasks t
        LEFT JOIN users c ON t.client_id = c.id
        LEFT JOIN users con ON t.contractor_id = con.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `).bind(taskId).first()
      // Non-blocking notification
      try {
        const recipients = []
        if (task.client_id) {
          const client = await env.DB.prepare('SELECT id, email, display_name FROM users WHERE id = ?').bind(task.client_id).first()
          if (client) recipients.push(client)
        }
        if (recipients.length > 0) notifyTaskStatusChange(updated, 'submitted', recipients)
      } catch (e) { /* notification errors are non-critical */ }
      return jsonResponse({ success: true, data: updated })
    } catch (err) {
      console.error('Pass task error:', err)
      return jsonResponse({ success: false, error: 'Failed to pass on task' }, 500)
    }
  }

  // GET /tasks - list tasks with filters
  if (path === '/tasks' && method === 'GET') {
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
      const priorityFilter = url.searchParams.get('priority')
      const categoryFilter = url.searchParams.get('category_id')
      const projectFilter = url.searchParams.get('project_id')
      const clientFilter = url.searchParams.get('client_id')
      const contractorFilter = url.searchParams.get('contractor_id')

      let query = `
        SELECT t.*,
          c.display_name as client_name,
          c.email as client_email,
          con.display_name as contractor_name,
          cat.name as category_name,
          p.name as project_name
        FROM tasks t
        LEFT JOIN users c ON t.client_id = c.id
        LEFT JOIN users con ON t.contractor_id = con.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN projects p ON t.project_id = p.id
      `
      const conditions = []
      const bindings = []

      // Role-based filtering
      if (auth.user.role === 'client') {
        conditions.push('t.client_id = ?')
        bindings.push(auth.user.id)
      } else if (auth.user.role === 'contractor') {
        conditions.push('t.contractor_id = ?')
        bindings.push(auth.user.id)
      }
      // Admin sees all tasks

      // Apply filters
      if (statusFilter) {
        conditions.push('t.status = ?')
        bindings.push(statusFilter)
      }
      if (priorityFilter) {
        conditions.push('t.priority = ?')
        bindings.push(priorityFilter)
      }
      if (categoryFilter) {
        conditions.push('t.category_id = ?')
        bindings.push(categoryFilter)
      }
      if (projectFilter) {
        conditions.push('t.project_id = ?')
        bindings.push(projectFilter)
      }
      if (clientFilter && auth.user.role === 'admin') {
        conditions.push('t.client_id = ?')
        bindings.push(clientFilter)
      }
      if (contractorFilter && auth.user.role === 'admin') {
        conditions.push('t.contractor_id = ?')
        bindings.push(contractorFilter)
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }

      query += ' ORDER BY t.created_at DESC'

      const stmt = env.DB.prepare(query)
      const result = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('List tasks error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch tasks' },
        500
      )
    }
  }

  // GET /tasks/:id - get single task
  const getMatch = path.match(/^\/tasks\/([^\/]+)$/)
  if (getMatch && method === 'GET') {
    const taskId = getMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const task = await env.DB.prepare(`
        SELECT t.*,
          c.display_name as client_name,
          c.email as client_email,
          con.display_name as contractor_name,
          cat.name as category_name,
          p.name as project_name
        FROM tasks t
        LEFT JOIN users c ON t.client_id = c.id
        LEFT JOIN users con ON t.contractor_id = con.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `).bind(taskId).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      // Check permissions
      const hasAccess =
        auth.user.role === 'admin' ||
        task.client_id === auth.user.id ||
        task.contractor_id === auth.user.id

      if (!hasAccess) {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      return jsonResponse({
        success: true,
        data: task,
      })
    } catch (err) {
      console.error('Get task error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch task' },
        500
      )
    }
  }

  // POST /tasks - create task
  if (path === '/tasks' && method === 'POST') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    // Only client and admin can create tasks
    if (!['client', 'admin'].includes(auth.user.role)) {
      return jsonResponse(
        { success: false, error: 'Insufficient permissions' },
        403
      )
    }

    try {
      const body = await request.json()
      const { title, description, priority, category_id, project_id, client_id, template_id, deadline, campfire_eligible, complexity_level } = body

      if (!title || !description || !priority || !category_id || !project_id) {
        return jsonResponse(
          { success: false, error: 'Missing required fields: title, description, priority, category_id, project_id' },
          400
        )
      }

      // Validate priority
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        return jsonResponse(
          { success: false, error: 'Invalid priority' },
          400
        )
      }

      // Determine client_id
      let finalClientId
      if (auth.user.role === 'client') {
        // Clients can only create tasks for themselves
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

      // Verify project exists and belongs to client
      const project = await env.DB.prepare(
        'SELECT id, client_id FROM projects WHERE id = ?'
      ).bind(project_id).first()

      if (!project) {
        return jsonResponse(
          { success: false, error: 'Invalid project_id' },
          400
        )
      }

      if (project.client_id !== finalClientId) {
        return jsonResponse(
          { success: false, error: 'Project does not belong to this client' },
          400
        )
      }

      const taskId = crypto.randomUUID()

      await env.DB.prepare(`
        INSERT INTO tasks (
          id, title, description, status, priority, category_id, project_id,
          client_id, created_by, template_id, deadline, ai_metadata, campfire_eligible, complexity_level
        )
        VALUES (?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
      `).bind(
        taskId,
        title,
        description,
        priority,
        category_id,
        project_id,
        finalClientId,
        auth.user.id,
        template_id || null,
        deadline || null,
        campfire_eligible ? 1 : 0,
        complexity_level != null ? Number(complexity_level) : null
      ).run()

      // Create initial history entry
      await env.DB.prepare(`
        INSERT INTO task_history (id, task_id, changed_by, from_status, to_status, note)
        VALUES (?, ?, ?, NULL, 'submitted', 'Task created')
      `).bind(crypto.randomUUID(), taskId, auth.user.id).run()

      const newTask = await env.DB.prepare(`
        SELECT t.*,
          c.display_name as client_name,
          cat.name as category_name,
          p.name as project_name
        FROM tasks t
        LEFT JOIN users c ON t.client_id = c.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `).bind(taskId).first()

      return jsonResponse(
        {
          success: true,
          data: newTask,
        },
        201
      )
    } catch (err) {
      console.error('Create task error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to create task' },
        500
      )
    }
  }

  // PUT /tasks/:id - update task (non-status fields)
  const updateMatch = path.match(/^\/tasks\/([^\/]+)$/)
  if (updateMatch && method === 'PUT') {
    const taskId = updateMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // Fetch current task
      const task = await env.DB.prepare(
        'SELECT * FROM tasks WHERE id = ?'
      ).bind(taskId).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      const body = await request.json()

      // Admin can update most fields, contractor cannot edit brief
      if (auth.user.role === 'contractor') {
        const allowedFields = ['deadline']
        const requestedFields = Object.keys(body).filter(f => f !== 'status')
        const invalidFields = requestedFields.filter(f => !allowedFields.includes(f))

        if (invalidFields.length > 0) {
          return jsonResponse(
            { success: false, error: 'Contractors can only update deadline' },
            403
          )
        }

        if (task.contractor_id !== auth.user.id) {
          return jsonResponse(
            { success: false, error: 'You are not assigned to this task' },
            403
          )
        }
      }

      const updates = []
      const bindings = []

      // Never allow status change via PUT (use PATCH /tasks/:id/status)
      if (body.status !== undefined) {
        return jsonResponse(
          { success: false, error: 'Use PATCH /tasks/:id/status to change status' },
          400
        )
      }

      if (auth.user.role === 'admin') {
        if (body.title !== undefined) {
          updates.push('title = ?')
          bindings.push(body.title)
        }
        if (body.description !== undefined) {
          updates.push('description = ?')
          bindings.push(body.description)
        }
        if (body.priority !== undefined) {
          if (!['low', 'medium', 'high', 'urgent'].includes(body.priority)) {
            return jsonResponse(
              { success: false, error: 'Invalid priority' },
              400
            )
          }
          updates.push('priority = ?')
          bindings.push(body.priority)
        }
        if (body.category_id !== undefined) {
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
        if (body.project_id !== undefined) {
          const project = await env.DB.prepare(
            'SELECT id, client_id FROM projects WHERE id = ?'
          ).bind(body.project_id).first()

          if (!project) {
            return jsonResponse(
              { success: false, error: 'Invalid project_id' },
              400
            )
          }
          if (project.client_id !== task.client_id) {
            return jsonResponse(
              { success: false, error: 'Project does not belong to this client' },
              400
            )
          }
          updates.push('project_id = ?')
          bindings.push(body.project_id)
        }
      }

      // Both admin and contractor can update deadline
      if (body.deadline !== undefined) {
        updates.push('deadline = ?')
        bindings.push(body.deadline)
      }

      // Admin can toggle campfire eligibility
      if (body.campfire_eligible !== undefined && auth.user.role === 'admin') {
        updates.push('campfire_eligible = ?')
        bindings.push(body.campfire_eligible ? 1 : 0)
      }

      // Admin can set complexity level (0-12)
      if (body.complexity_level !== undefined && auth.user.role === 'admin') {
        const level = Number(body.complexity_level)
        if (body.complexity_level === null || body.complexity_level === '') {
          updates.push('complexity_level = ?')
          bindings.push(null)
        } else if (!isNaN(level) && level >= 0 && level <= 12) {
          updates.push('complexity_level = ?')
          bindings.push(level)
        }
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: 'No fields to update' },
          400
        )
      }

      updates.push('updated_at = datetime("now")')
      bindings.push(taskId)

      await env.DB.prepare(`
        UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
      `).bind(...bindings).run()

      const updatedTask = await env.DB.prepare(`
        SELECT t.*,
          c.display_name as client_name,
          con.display_name as contractor_name,
          cat.name as category_name,
          p.name as project_name
        FROM tasks t
        LEFT JOIN users c ON t.client_id = c.id
        LEFT JOIN users con ON t.contractor_id = con.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `).bind(taskId).first()

      return jsonResponse({
        success: true,
        data: updatedTask,
      })
    } catch (err) {
      console.error('Update task error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to update task' },
        500
      )
    }
  }

  // PATCH /tasks/:id/status - update task status (state machine)
  const statusMatch = path.match(/^\/tasks\/([^\/]+)\/status$/)
  if (statusMatch && method === 'PATCH') {
    const taskId = statusMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // Fetch current task
      const task = await env.DB.prepare(
        'SELECT * FROM tasks WHERE id = ?'
      ).bind(taskId).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      const body = await request.json()
      const { status: newStatus, contractor_id, note } = body

      if (!newStatus) {
        return jsonResponse(
          { success: false, error: 'status is required' },
          400
        )
      }

      // Validate transition
      const validation = await validateTransition(
        env,
        task,
        newStatus,
        { contractor_id, note },
        auth
      )

      if (!validation.valid) {
        return jsonResponse(
          { success: false, error: validation.error },
          400
        )
      }

      // Build update query
      const updates = ['status = ?', 'updated_at = datetime("now")']
      const bindings = [newStatus]

      // If assigning, set contractor_id
      if (newStatus === 'assigned' && contractor_id) {
        // Verify contractor exists
        const contractorExists = await env.DB.prepare(
          'SELECT id FROM users WHERE id = ? AND role = "contractor"'
        ).bind(contractor_id).first()

        if (!contractorExists) {
          return jsonResponse(
            { success: false, error: 'Invalid contractor_id' },
            400
          )
        }
        updates.push('contractor_id = ?')
        bindings.push(contractor_id)
      }

      bindings.push(taskId)

      // Update task
      await env.DB.prepare(`
        UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
      `).bind(...bindings).run()

      // Create history entry
      await env.DB.prepare(`
        INSERT INTO task_history (id, task_id, changed_by, from_status, to_status, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        taskId,
        auth.user.id,
        task.status,
        newStatus,
        note || null
      ).run()

      const updatedTask = await env.DB.prepare(`
        SELECT t.*,
          c.display_name as client_name,
          con.display_name as contractor_name,
          cat.name as category_name,
          p.name as project_name
        FROM tasks t
        LEFT JOIN users c ON t.client_id = c.id
        LEFT JOIN users con ON t.contractor_id = con.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `).bind(taskId).first()

      return jsonResponse({
        success: true,
        data: updatedTask,
      })
    } catch (err) {
      console.error('Update task status error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to update task status' },
        500
      )
    }
  }

  // DELETE /tasks/:id - delete task (admin only)
  const deleteMatch = path.match(/^\/tasks\/([^\/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    const taskId = deleteMatch[1]
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }
    const roleCheck = requireRole(auth, ['admin'])
    if (!roleCheck.authorized) {
      return jsonResponse({ success: false, error: roleCheck.error }, roleCheck.status)
    }
    try {
      const task = await env.DB.prepare('SELECT id FROM tasks WHERE id = ?').bind(taskId).first()
      if (!task) {
        return jsonResponse({ success: false, error: 'Task not found' }, 404)
      }
      // Delete related records first
      await env.DB.prepare('DELETE FROM task_comments WHERE task_id = ?').bind(taskId).run()
      await env.DB.prepare('DELETE FROM task_history WHERE task_id = ?').bind(taskId).run()
      await env.DB.prepare('DELETE FROM time_entries WHERE task_id = ?').bind(taskId).run()
      await env.DB.prepare('DELETE FROM reviews WHERE task_id = ?').bind(taskId).run()
      await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId).run()
      return jsonResponse({ success: true })
    } catch (err) {
      console.error('Delete task error:', err)
      return jsonResponse({ success: false, error: 'Failed to delete task' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
