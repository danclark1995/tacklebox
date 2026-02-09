/**
 * Analytics Routes — Admin-only dashboard analytics
 * GET /analytics/tasks - task overview
 * GET /analytics/turnaround - turnaround times
 * GET /analytics/categories - category breakdown
 * GET /analytics/projects - project progress
 * GET /analytics/contractors - contractor performance
 * GET /analytics/time - time tracking summary
 * GET /analytics/reviews - review insights
 *
 * All endpoints accept optional query params: date_from, date_to,
 * client_id, contractor_id, category_id, project_id
 */

import { jsonResponse } from '../index.js'
import { requireRole } from '../middleware/auth.js'

/**
 * Build WHERE conditions and bindings from common filter params.
 * tableAlias is the alias used for the tasks table (e.g. 't').
 */
function applyFilters(url, tableAlias = 't') {
  const conditions = []
  const bindings = []

  const dateFrom = url.searchParams.get('date_from')
  const dateTo = url.searchParams.get('date_to')
  const clientId = url.searchParams.get('client_id')
  const contractorId = url.searchParams.get('contractor_id')
  const categoryId = url.searchParams.get('category_id')
  const projectId = url.searchParams.get('project_id')

  if (dateFrom) {
    conditions.push(`${tableAlias}.created_at >= ?`)
    bindings.push(dateFrom)
  }
  if (dateTo) {
    conditions.push(`${tableAlias}.created_at <= ?`)
    bindings.push(dateTo)
  }
  if (clientId) {
    conditions.push(`${tableAlias}.client_id = ?`)
    bindings.push(clientId)
  }
  if (contractorId) {
    conditions.push(`${tableAlias}.contractor_id = ?`)
    bindings.push(contractorId)
  }
  if (categoryId) {
    conditions.push(`${tableAlias}.category_id = ?`)
    bindings.push(categoryId)
  }
  if (projectId) {
    conditions.push(`${tableAlias}.project_id = ?`)
    bindings.push(projectId)
  }

  return { conditions, bindings }
}

function buildWhere(conditions, prefix = 'WHERE') {
  if (conditions.length === 0) return ''
  return ` ${prefix} ` + conditions.join(' AND ')
}

export async function handleAnalytics(request, env, auth, path, method) {
  // All analytics routes are admin only
  const authCheck = requireRole(auth, 'admin')
  if (!authCheck.authorized) {
    return jsonResponse(
      { success: false, error: authCheck.error },
      authCheck.status
    )
  }

  const url = new URL(request.url)

  // GET /analytics/tasks - task overview
  if (path === '/analytics/tasks' && method === 'GET') {
    try {
      const { conditions, bindings } = applyFilters(url)
      const where = buildWhere(conditions)

      // Total tasks
      const totalResult = await env.DB.prepare(
        `SELECT COUNT(*) as total FROM tasks t${where}`
      ).bind(...bindings).first()

      // Tasks by status
      const byStatusResult = await env.DB.prepare(
        `SELECT t.status, COUNT(*) as count FROM tasks t${where} GROUP BY t.status ORDER BY count DESC`
      ).bind(...bindings).all()

      // Tasks created per month (last 12 months)
      const perMonthConditions = [...conditions]
      const perMonthBindings = [...bindings]
      perMonthConditions.push("t.created_at >= datetime('now', '-12 months')")
      const perMonthWhere = buildWhere(perMonthConditions)

      const perMonthResult = await env.DB.prepare(
        `SELECT strftime('%Y-%m', t.created_at) as month, COUNT(*) as count
         FROM tasks t${perMonthWhere}
         GROUP BY month ORDER BY month ASC`
      ).bind(...perMonthBindings).all()

      // Avg time in each status (using task_history timestamps)
      // Calculate avg duration between consecutive status changes
      const avgTimeResult = await env.DB.prepare(`
        SELECT th.to_status as status,
          AVG(
            CASE WHEN th_next.created_at IS NOT NULL
              THEN julianday(th_next.created_at) - julianday(th.created_at)
              ELSE julianday('now') - julianday(th.created_at)
            END
          ) as avg_days
        FROM task_history th
        JOIN tasks t ON th.task_id = t.id
        LEFT JOIN task_history th_next ON th_next.task_id = th.task_id
          AND th_next.created_at > th.created_at
          AND NOT EXISTS (
            SELECT 1 FROM task_history th2
            WHERE th2.task_id = th.task_id
              AND th2.created_at > th.created_at
              AND th2.created_at < th_next.created_at
          )
        ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
        GROUP BY th.to_status
      `).bind(...bindings).all()

      return jsonResponse({
        success: true,
        data: {
          total_tasks: totalResult.total,
          by_status: byStatusResult.results || [],
          per_month: perMonthResult.results || [],
          avg_time_in_status: avgTimeResult.results || [],
        },
      })
    } catch (err) {
      console.error('Analytics tasks error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch task analytics' },
        500
      )
    }
  }

  // GET /analytics/turnaround - turnaround times
  if (path === '/analytics/turnaround' && method === 'GET') {
    try {
      const { conditions, bindings } = applyFilters(url)
      const closedConditions = [...conditions, "t.status = 'closed'"]
      const closedWhere = buildWhere(closedConditions)

      // Avg days from created to closed (overall)
      const avgOverall = await env.DB.prepare(`
        SELECT AVG(julianday(t.updated_at) - julianday(t.created_at)) as avg_days
        FROM tasks t${closedWhere}
      `).bind(...bindings).first()

      // Avg by priority
      const avgByPriority = await env.DB.prepare(`
        SELECT t.priority, AVG(julianday(t.updated_at) - julianday(t.created_at)) as avg_days, COUNT(*) as count
        FROM tasks t${closedWhere}
        GROUP BY t.priority ORDER BY avg_days ASC
      `).bind(...bindings).all()

      // Completed tasks per month
      const perMonthResult = await env.DB.prepare(`
        SELECT strftime('%Y-%m', t.updated_at) as month, COUNT(*) as count
        FROM tasks t${closedWhere}
        GROUP BY month ORDER BY month ASC
      `).bind(...bindings).all()

      // Trend line data: monthly avg turnaround
      const trendResult = await env.DB.prepare(`
        SELECT strftime('%Y-%m', t.updated_at) as month,
          AVG(julianday(t.updated_at) - julianday(t.created_at)) as avg_days
        FROM tasks t${closedWhere}
        GROUP BY month ORDER BY month ASC
      `).bind(...bindings).all()

      return jsonResponse({
        success: true,
        data: {
          avg_days_overall: avgOverall.avg_days || 0,
          avg_by_priority: avgByPriority.results || [],
          completed_per_month: perMonthResult.results || [],
          trend: trendResult.results || [],
        },
      })
    } catch (err) {
      console.error('Analytics turnaround error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch turnaround analytics' },
        500
      )
    }
  }

  // GET /analytics/categories - category breakdown
  if (path === '/analytics/categories' && method === 'GET') {
    try {
      const { conditions, bindings } = applyFilters(url)
      const where = buildWhere(conditions)

      // Tasks per category
      const tasksPerCategory = await env.DB.prepare(`
        SELECT cat.id, cat.name, COUNT(t.id) as task_count
        FROM task_categories cat
        LEFT JOIN tasks t ON t.category_id = cat.id ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
        GROUP BY cat.id, cat.name
        ORDER BY task_count DESC
      `).bind(...bindings).all()

      // Avg time per category (from time_entries)
      const avgTimePerCategory = await env.DB.prepare(`
        SELECT cat.id, cat.name,
          AVG(te.duration_minutes) as avg_minutes,
          SUM(te.duration_minutes) as total_minutes
        FROM task_categories cat
        LEFT JOIN tasks t ON t.category_id = cat.id ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
        LEFT JOIN time_entries te ON te.task_id = t.id
        GROUP BY cat.id, cat.name
        ORDER BY total_minutes DESC
      `).bind(...bindings).all()

      // Avg quality per category (from admin reviews)
      const avgQualityPerCategory = await env.DB.prepare(`
        SELECT cat.id, cat.name, AVG(tr.quality_rating) as avg_quality
        FROM task_categories cat
        LEFT JOIN tasks t ON t.category_id = cat.id ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
        LEFT JOIN task_reviews tr ON tr.task_id = t.id AND tr.reviewer_role = 'admin' AND tr.quality_rating IS NOT NULL
        GROUP BY cat.id, cat.name
        ORDER BY avg_quality DESC
      `).bind(...bindings).all()

      return jsonResponse({
        success: true,
        data: {
          tasks_per_category: tasksPerCategory.results || [],
          avg_time_per_category: avgTimePerCategory.results || [],
          avg_quality_per_category: avgQualityPerCategory.results || [],
        },
      })
    } catch (err) {
      console.error('Analytics categories error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch category analytics' },
        500
      )
    }
  }

  // GET /analytics/projects - project progress
  if (path === '/analytics/projects' && method === 'GET') {
    try {
      const { conditions, bindings } = applyFilters(url)

      // Build task-level filter for project join
      const taskFilter = conditions.length > 0
        ? 'AND ' + conditions.join(' AND ')
        : ''

      const result = await env.DB.prepare(`
        SELECT p.id, p.name, p.status,
          u.display_name as client_name,
          COUNT(t.id) as total_tasks,
          SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) as completed_tasks,
          CASE WHEN COUNT(t.id) > 0
            THEN ROUND(100.0 * SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) / COUNT(t.id), 1)
            ELSE 0 END as completion_pct,
          COALESCE(SUM(te_totals.total_minutes), 0) as total_time_minutes
        FROM projects p
        LEFT JOIN users u ON p.client_id = u.id
        LEFT JOIN tasks t ON t.project_id = p.id ${taskFilter}
        LEFT JOIN (
          SELECT task_id, SUM(duration_minutes) as total_minutes
          FROM time_entries GROUP BY task_id
        ) te_totals ON te_totals.task_id = t.id
        GROUP BY p.id, p.name, p.status, u.display_name
        ORDER BY p.name ASC
      `).bind(...bindings).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('Analytics projects error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch project analytics' },
        500
      )
    }
  }

  // GET /analytics/contractors - contractor performance
  if (path === '/analytics/contractors' && method === 'GET') {
    try {
      const { conditions, bindings } = applyFilters(url)
      const taskFilter = conditions.length > 0
        ? 'AND ' + conditions.join(' AND ')
        : ''

      const result = await env.DB.prepare(`
        SELECT u.id, u.display_name, u.email,
          COALESCE(cx.total_xp, 0) as total_xp,
          COALESCE(cx.current_level, 1) as current_level,
          COALESCE(xl.name, 'Rookie') as level_name,
          COUNT(t.id) as tasks_completed,
          CASE WHEN COUNT(CASE WHEN t.deadline IS NOT NULL THEN 1 END) > 0
            THEN ROUND(100.0 * SUM(
              CASE WHEN t.deadline IS NOT NULL AND EXISTS (
                SELECT 1 FROM task_history th
                WHERE th.task_id = t.id AND th.to_status = 'closed' AND th.created_at <= t.deadline
              ) THEN 1 ELSE 0 END
            ) / COUNT(CASE WHEN t.deadline IS NOT NULL THEN 1 END), 1)
            ELSE 0 END as on_time_pct,
          COALESCE(cx.avg_quality_rating, 0) as avg_quality,
          COALESCE(hours.total_minutes, 0) as total_hours_minutes
        FROM users u
        LEFT JOIN tasks t ON t.contractor_id = u.id AND t.status = 'closed' ${taskFilter}
        LEFT JOIN contractor_xp cx ON cx.user_id = u.id
        LEFT JOIN xp_levels xl ON xl.level = cx.current_level
        LEFT JOIN (
          SELECT user_id, SUM(duration_minutes) as total_minutes
          FROM time_entries GROUP BY user_id
        ) hours ON hours.user_id = u.id
        WHERE u.role = 'contractor'
        GROUP BY u.id, u.display_name, u.email
        ORDER BY total_xp DESC
      `).bind(...bindings).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('Analytics contractors error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch contractor analytics' },
        500
      )
    }
  }

  // GET /analytics/time - time tracking summary
  if (path === '/analytics/time' && method === 'GET') {
    try {
      const { conditions, bindings } = applyFilters(url)
      const taskFilter = conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ')
        : ''

      // Total hours
      const totalResult = await env.DB.prepare(`
        SELECT COALESCE(SUM(te.duration_minutes), 0) as total_minutes
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        ${taskFilter}
      `).bind(...bindings).all()
      const totalMinutes = totalResult.results[0]?.total_minutes || 0

      // Hours by contractor
      const byContractor = await env.DB.prepare(`
        SELECT u.id, u.display_name, SUM(te.duration_minutes) as total_minutes
        FROM time_entries te
        JOIN users u ON te.user_id = u.id
        JOIN tasks t ON te.task_id = t.id
        ${taskFilter}
        GROUP BY u.id, u.display_name
        ORDER BY total_minutes DESC
      `).bind(...bindings).all()

      // Hours by client
      const byClient = await env.DB.prepare(`
        SELECT c.id, c.display_name, SUM(te.duration_minutes) as total_minutes
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        JOIN users c ON t.client_id = c.id
        ${taskFilter}
        GROUP BY c.id, c.display_name
        ORDER BY total_minutes DESC
      `).bind(...bindings).all()

      // Hours by category
      const byCategory = await env.DB.prepare(`
        SELECT cat.id, cat.name, SUM(te.duration_minutes) as total_minutes
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        ${taskFilter}
        GROUP BY cat.id, cat.name
        ORDER BY total_minutes DESC
      `).bind(...bindings).all()

      // Avg hours per task
      const avgPerTask = await env.DB.prepare(`
        SELECT AVG(task_totals.total_minutes) as avg_minutes
        FROM (
          SELECT te.task_id, SUM(te.duration_minutes) as total_minutes
          FROM time_entries te
          JOIN tasks t ON te.task_id = t.id
          ${taskFilter}
          GROUP BY te.task_id
        ) task_totals
      `).bind(...bindings).first()

      return jsonResponse({
        success: true,
        data: {
          total_minutes: totalMinutes,
          by_contractor: byContractor.results || [],
          by_client: byClient.results || [],
          by_category: byCategory.results || [],
          avg_minutes_per_task: avgPerTask.avg_minutes || 0,
        },
      })
    } catch (err) {
      console.error('Analytics time error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch time analytics' },
        500
      )
    }
  }

  // GET /analytics/reviews - review insights
  if (path === '/analytics/reviews' && method === 'GET') {
    try {
      const { conditions, bindings } = applyFilters(url)
      const taskFilter = conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ')
        : ''

      // Total reviews
      const totalReviews = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM task_reviews tr
        JOIN tasks t ON tr.task_id = t.id
        ${taskFilter}
      `).bind(...bindings).first()

      // Completion rate: reviews vs closed tasks
      const closedTasks = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM tasks t
        ${taskFilter ? taskFilter + " AND t.status = 'closed'" : "WHERE t.status = 'closed'"}
      `).bind(...bindings).first()

      const reviewedTasks = await env.DB.prepare(`
        SELECT COUNT(DISTINCT tr.task_id) as count
        FROM task_reviews tr
        JOIN tasks t ON tr.task_id = t.id
        ${taskFilter}
      `).bind(...bindings).first()

      const completionRate = closedTasks.count > 0
        ? Math.round((reviewedTasks.count / closedTasks.count) * 1000) / 10
        : 0

      // Avg difficulty (contractor reviews)
      const avgDifficulty = await env.DB.prepare(`
        SELECT AVG(tr.difficulty_rating) as avg_difficulty
        FROM task_reviews tr
        JOIN tasks t ON tr.task_id = t.id
        ${taskFilter ? taskFilter + " AND tr.reviewer_role = 'contractor' AND tr.difficulty_rating IS NOT NULL" : "WHERE tr.reviewer_role = 'contractor' AND tr.difficulty_rating IS NOT NULL"}
      `).bind(...bindings).first()

      // Avg quality (admin reviews)
      const avgQuality = await env.DB.prepare(`
        SELECT AVG(tr.quality_rating) as avg_quality
        FROM task_reviews tr
        JOIN tasks t ON tr.task_id = t.id
        ${taskFilter ? taskFilter + " AND tr.reviewer_role = 'admin' AND tr.quality_rating IS NOT NULL" : "WHERE tr.reviewer_role = 'admin' AND tr.quality_rating IS NOT NULL"}
      `).bind(...bindings).first()

      return jsonResponse({
        success: true,
        data: {
          total_reviews: totalReviews.count,
          closed_tasks: closedTasks.count,
          reviewed_tasks: reviewedTasks.count,
          completion_rate_pct: completionRate,
          avg_difficulty: avgDifficulty.avg_difficulty || 0,
          avg_quality: avgQuality.avg_quality || 0,
        },
      })
    } catch (err) {
      console.error('Analytics reviews error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch review analytics' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
