/**
 * Review Routes
 * GET /reviews?task_id= - list reviews for a task
 * POST /reviews - create review
 * GET /reviews/:id - get single review
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'

export async function handleReviews(request, env, auth, path, method) {
  // GET /reviews?task_id= - list reviews for a task
  if (path === '/reviews' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const url = new URL(request.url)
      const taskId = url.searchParams.get('task_id')

      if (!taskId) {
        return jsonResponse(
          { success: false, error: 'task_id is required' },
          400
        )
      }

      // Verify task exists
      const task = await env.DB.prepare(
        'SELECT id, client_id, contractor_id FROM tasks WHERE id = ?'
      ).bind(taskId).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      // Client gets no access to reviews
      if (auth.user.role === 'client') {
        return jsonResponse({
          success: true,
          data: [],
        })
      }

      let query = `
        SELECT r.*,
          u.display_name as reviewer_name
        FROM task_reviews r
        LEFT JOIN users u ON r.reviewer_id = u.id
        WHERE r.task_id = ?
      `
      const bindings = [taskId]

      // Contractor sees only own review
      if (auth.user.role === 'contractor') {
        query += ' AND r.reviewer_role = ?'
        bindings.push('contractor')
      }
      // Admin sees all reviews

      query += ' ORDER BY r.created_at ASC'

      const result = await env.DB.prepare(query).bind(...bindings).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('List reviews error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch reviews' },
        500
      )
    }
  }

  // POST /reviews - create review
  if (path === '/reviews' && method === 'POST') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    // Only contractor and admin can create reviews
    if (!['contractor', 'admin'].includes(auth.user.role)) {
      return jsonResponse(
        { success: false, error: 'Insufficient permissions' },
        403
      )
    }

    try {
      const body = await request.json()
      const { task_id } = body

      if (!task_id) {
        return jsonResponse(
          { success: false, error: 'task_id is required' },
          400
        )
      }

      // Verify task exists and is closed
      const task = await env.DB.prepare(
        'SELECT id, status, contractor_id FROM tasks WHERE id = ?'
      ).bind(task_id).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      if (task.status !== 'closed') {
        return jsonResponse(
          { success: false, error: 'Reviews can only be created for closed tasks' },
          400
        )
      }

      const reviewId = crypto.randomUUID()
      const reviewerRole = auth.user.role

      // Contractor review
      if (reviewerRole === 'contractor') {
        // Contractor must be the assigned contractor
        if (task.contractor_id !== auth.user.id) {
          return jsonResponse(
            { success: false, error: 'Only the assigned contractor can review this task' },
            403
          )
        }

        const {
          total_time_actual,
          difficulty_rating,
          what_went_well,
          what_to_improve,
          blockers_encountered,
        } = body

        // Validate difficulty_rating
        if (difficulty_rating !== undefined && difficulty_rating !== null) {
          if (!Number.isInteger(difficulty_rating) || difficulty_rating < 1 || difficulty_rating > 5) {
            return jsonResponse(
              { success: false, error: 'difficulty_rating must be an integer between 1 and 5' },
              400
            )
          }
        }

        // Check unique constraint (one review per role per task)
        const existing = await env.DB.prepare(
          'SELECT id FROM task_reviews WHERE task_id = ? AND reviewer_role = ?'
        ).bind(task_id, 'contractor').first()

        if (existing) {
          return jsonResponse(
            { success: false, error: 'A contractor review already exists for this task' },
            409
          )
        }

        await env.DB.prepare(`
          INSERT INTO task_reviews (
            id, task_id, reviewer_id, reviewer_role,
            difficulty_rating, total_time_actual,
            what_went_well, what_to_improve, blockers_encountered
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          reviewId,
          task_id,
          auth.user.id,
          'contractor',
          difficulty_rating || null,
          total_time_actual || null,
          what_went_well || null,
          what_to_improve || null,
          blockers_encountered || null
        ).run()
      }

      // Admin review
      if (reviewerRole === 'admin') {
        const {
          quality_rating,
          time_assessment,
          estimated_time_future,
          client_feedback_summary,
          what_to_improve,
          internal_notes,
        } = body

        // Validate quality_rating
        if (quality_rating !== undefined && quality_rating !== null) {
          if (!Number.isInteger(quality_rating) || quality_rating < 1 || quality_rating > 5) {
            return jsonResponse(
              { success: false, error: 'quality_rating must be an integer between 1 and 5' },
              400
            )
          }
        }

        // Validate time_assessment
        if (time_assessment !== undefined && time_assessment !== null) {
          if (!['under', 'about_right', 'over'].includes(time_assessment)) {
            return jsonResponse(
              { success: false, error: 'time_assessment must be one of: under, about_right, over' },
              400
            )
          }
        }

        // Validate estimated_time_future
        if (estimated_time_future !== undefined && estimated_time_future !== null) {
          if (!Number.isInteger(estimated_time_future) || estimated_time_future % 15 !== 0) {
            return jsonResponse(
              { success: false, error: 'estimated_time_future must be an integer and a multiple of 15' },
              400
            )
          }
        }

        // Check unique constraint (one review per role per task)
        const existing = await env.DB.prepare(
          'SELECT id FROM task_reviews WHERE task_id = ? AND reviewer_role = ?'
        ).bind(task_id, 'admin').first()

        if (existing) {
          return jsonResponse(
            { success: false, error: 'An admin review already exists for this task' },
            409
          )
        }

        await env.DB.prepare(`
          INSERT INTO task_reviews (
            id, task_id, reviewer_id, reviewer_role,
            quality_rating, time_assessment, estimated_time_future,
            client_feedback_summary, what_to_improve, internal_notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          reviewId,
          task_id,
          auth.user.id,
          'admin',
          quality_rating || null,
          time_assessment || null,
          estimated_time_future || null,
          client_feedback_summary || null,
          what_to_improve || null,
          internal_notes || null
        ).run()
      }

      const newReview = await env.DB.prepare(`
        SELECT r.*,
          u.display_name as reviewer_name
        FROM task_reviews r
        LEFT JOIN users u ON r.reviewer_id = u.id
        WHERE r.id = ?
      `).bind(reviewId).first()

      return jsonResponse(
        {
          success: true,
          data: newReview,
        },
        201
      )
    } catch (err) {
      console.error('Create review error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to create review' },
        500
      )
    }
  }

  // GET /reviews/:id - get single review
  const getMatch = path.match(/^\/reviews\/([^\/]+)$/)
  if (getMatch && method === 'GET') {
    const reviewId = getMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const review = await env.DB.prepare(`
        SELECT r.*,
          u.display_name as reviewer_name
        FROM task_reviews r
        LEFT JOIN users u ON r.reviewer_id = u.id
        WHERE r.id = ?
      `).bind(reviewId).first()

      if (!review) {
        return jsonResponse(
          { success: false, error: 'Review not found' },
          404
        )
      }

      // Check permissions
      if (auth.user.role === 'client') {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      if (auth.user.role === 'contractor' && review.reviewer_id !== auth.user.id) {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }
      // Admin can see all reviews

      return jsonResponse({
        success: true,
        data: review,
      })
    } catch (err) {
      console.error('Get review error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch review' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
