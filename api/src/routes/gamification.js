/**
 * Gamification Routes — XP, Levels, Badges, Leaderboard
 * GET /gamification/xp/:userId - get contractor XP profile
 * GET /gamification/levels - get all XP levels
 * GET /gamification/badges - get all available badges
 * GET /gamification/badges/:userId - get badges earned by a user
 * GET /gamification/leaderboard - get leaderboard
 * POST /gamification/recalculate/:userId - recalculate XP (admin only)
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

// XP reward values
const XP_REWARDS = {
  TASK_COMPLETED: 100,
  ON_TIME_BONUS: 50,
  FIVE_STAR_BONUS: 75,
  UNDER_ESTIMATED_BONUS: 25,
  REVIEW_COMPLETED: 10,
}

export async function handleGamification(request, env, auth, path, method) {
  // GET /gamification/levels - get all XP levels
  if (path === '/gamification/levels' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const result = await env.DB.prepare(
        'SELECT * FROM xp_levels ORDER BY level ASC'
      ).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('Get levels error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch levels' },
        500
      )
    }
  }

  // GET /gamification/badges - get all available badges (no userId in path)
  if (path === '/gamification/badges' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const result = await env.DB.prepare(
        'SELECT * FROM badges ORDER BY name ASC'
      ).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('Get badges error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch badges' },
        500
      )
    }
  }

  // GET /gamification/leaderboard - get leaderboard
  if (path === '/gamification/leaderboard' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      if (auth.user.role === 'admin') {
        // Admin: full ranking of all contractors
        const result = await env.DB.prepare(`
          SELECT cx.*, u.display_name, u.email,
            xl.name as level_name, xl.icon as level_icon
          FROM contractor_xp cx
          JOIN users u ON cx.user_id = u.id
          LEFT JOIN xp_levels xl ON cx.current_level = xl.level
          ORDER BY cx.total_xp DESC
        `).all()

        return jsonResponse({
          success: true,
          data: result.results || [],
        })
      }

      // Contractor: own rank + top 5
      const allRanked = await env.DB.prepare(`
        SELECT cx.*, u.display_name,
          xl.name as level_name, xl.icon as level_icon
        FROM contractor_xp cx
        JOIN users u ON cx.user_id = u.id
        LEFT JOIN xp_levels xl ON cx.current_level = xl.level
        ORDER BY cx.total_xp DESC
      `).all()

      const rankings = allRanked.results || []
      const top5 = rankings.slice(0, 5)

      // Find the current user's rank
      let ownRank = null
      let ownEntry = null
      for (let i = 0; i < rankings.length; i++) {
        if (rankings[i].user_id === auth.user.id) {
          ownRank = i + 1
          ownEntry = rankings[i]
          break
        }
      }

      return jsonResponse({
        success: true,
        data: {
          top5,
          own_rank: ownRank,
          own_entry: ownEntry,
        },
      })
    } catch (err) {
      console.error('Get leaderboard error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch leaderboard' },
        500
      )
    }
  }

  // GET /gamification/badges/:userId - get badges earned by a user
  const badgesUserMatch = path.match(/^\/gamification\/badges\/([^\/]+)$/)
  if (badgesUserMatch && method === 'GET') {
    const userId = badgesUserMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    // Admin can view any, contractor own only
    if (auth.user.role === 'contractor' && auth.user.id !== userId) {
      return jsonResponse(
        { success: false, error: 'You can only view your own badges' },
        403
      )
    }

    try {
      // Get all badges with earned status
      const result = await env.DB.prepare(`
        SELECT b.*,
          ub.awarded_at,
          CASE WHEN ub.user_id IS NOT NULL THEN 1 ELSE 0 END as earned
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
        ORDER BY b.name ASC
      `).bind(userId).all()

      const badges = (result.results || []).map(b => ({
        ...b,
        earned: b.earned === 1,
      }))

      return jsonResponse({
        success: true,
        data: badges,
      })
    } catch (err) {
      console.error('Get user badges error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch user badges' },
        500
      )
    }
  }

  // GET /gamification/xp/:userId - get contractor XP profile
  const xpMatch = path.match(/^\/gamification\/xp\/([^\/]+)$/)
  if (xpMatch && method === 'GET') {
    const userId = xpMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    // Admin can view any, contractor own only
    if (auth.user.role === 'contractor' && auth.user.id !== userId) {
      return jsonResponse(
        { success: false, error: 'You can only view your own XP profile' },
        403
      )
    }

    try {
      const xpData = await env.DB.prepare(
        'SELECT * FROM contractor_xp WHERE user_id = ?'
      ).bind(userId).first()

      if (!xpData) {
        return jsonResponse(
          { success: false, error: 'XP profile not found for this user' },
          404
        )
      }

      // Get current level details
      const currentLevel = await env.DB.prepare(
        'SELECT * FROM xp_levels WHERE level = ?'
      ).bind(xpData.current_level).first()

      // Get next level threshold
      const nextLevel = await env.DB.prepare(
        'SELECT * FROM xp_levels WHERE level = ?'
      ).bind(xpData.current_level + 1).first()

      return jsonResponse({
        success: true,
        data: {
          ...xpData,
          current_level_details: currentLevel,
          next_level: nextLevel || null,
          xp_to_next_level: nextLevel
            ? nextLevel.xp_threshold - xpData.total_xp
            : null,
        },
      })
    } catch (err) {
      console.error('Get XP profile error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch XP profile' },
        500
      )
    }
  }

  // POST /gamification/recalculate/:userId - admin only recalculate XP
  const recalcMatch = path.match(/^\/gamification\/recalculate\/([^\/]+)$/)
  if (recalcMatch && method === 'POST') {
    const userId = recalcMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // Verify user exists and is a contractor
      const user = await env.DB.prepare(
        'SELECT id, role FROM users WHERE id = ? AND role = ?'
      ).bind(userId, 'contractor').first()

      if (!user) {
        return jsonResponse(
          { success: false, error: 'Contractor not found' },
          404
        )
      }

      // a. Count tasks_completed
      const tasksResult = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE contractor_id = ? AND status = 'closed'"
      ).bind(userId).first()
      const tasksCompleted = tasksResult.count

      // b. Count on_time: tasks closed where deadline IS NOT NULL and close date <= deadline
      const onTimeResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM tasks t
        WHERE t.contractor_id = ?
          AND t.status = 'closed'
          AND t.deadline IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM task_history th
            WHERE th.task_id = t.id
              AND th.to_status = 'closed'
              AND th.created_at <= t.deadline
          )
      `).bind(userId).first()
      const onTimeCount = onTimeResult.count

      // Count total tasks with deadline
      const totalWithDeadline = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE contractor_id = ? AND status = 'closed' AND deadline IS NOT NULL
      `).bind(userId).first()
      const totalTasksWithDeadline = totalWithDeadline.count

      // c. Calculate avg_quality_rating from admin reviews
      const qualityResult = await env.DB.prepare(`
        SELECT AVG(tr.quality_rating) as avg_quality
        FROM task_reviews tr
        JOIN tasks t ON tr.task_id = t.id
        WHERE t.contractor_id = ?
          AND tr.reviewer_role = 'admin'
          AND tr.quality_rating IS NOT NULL
      `).bind(userId).first()
      const avgQualityRating = qualityResult.avg_quality || 0

      // d. Calculate total XP components

      // five_star_count: admin reviews with quality_rating = 5
      const fiveStarResult = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM task_reviews tr
        JOIN tasks t ON tr.task_id = t.id
        WHERE t.contractor_id = ?
          AND tr.reviewer_role = 'admin'
          AND tr.quality_rating = 5
      `).bind(userId).first()
      const fiveStarCount = fiveStarResult.count

      // under_estimated_count: admin reviews with time_assessment = 'under'
      const underEstimatedResult = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM task_reviews tr
        JOIN tasks t ON tr.task_id = t.id
        WHERE t.contractor_id = ?
          AND tr.reviewer_role = 'admin'
          AND tr.time_assessment = 'under'
      `).bind(userId).first()
      const underEstimatedCount = underEstimatedResult.count

      // reviews_completed: contractor's own reviews
      const reviewsResult = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM task_reviews WHERE reviewer_id = ? AND reviewer_role = 'contractor'"
      ).bind(userId).first()
      const reviewsCompleted = reviewsResult.count

      const totalXp =
        (tasksCompleted * XP_REWARDS.TASK_COMPLETED) +
        (onTimeCount * XP_REWARDS.ON_TIME_BONUS) +
        (fiveStarCount * XP_REWARDS.FIVE_STAR_BONUS) +
        (underEstimatedCount * XP_REWARDS.UNDER_ESTIMATED_BONUS) +
        (reviewsCompleted * XP_REWARDS.REVIEW_COMPLETED)

      // e. Determine current_level
      const levelResult = await env.DB.prepare(
        'SELECT level FROM xp_levels WHERE xp_threshold <= ? ORDER BY xp_threshold DESC LIMIT 1'
      ).bind(totalXp).first()
      const currentLevel = levelResult ? levelResult.level : 1

      // f. Upsert contractor_xp row
      await env.DB.prepare(`
        INSERT INTO contractor_xp (user_id, total_xp, current_level, tasks_completed, on_time_count, total_tasks_with_deadline, avg_quality_rating, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          total_xp = excluded.total_xp,
          current_level = excluded.current_level,
          tasks_completed = excluded.tasks_completed,
          on_time_count = excluded.on_time_count,
          total_tasks_with_deadline = excluded.total_tasks_with_deadline,
          avg_quality_rating = excluded.avg_quality_rating,
          updated_at = excluded.updated_at
      `).bind(
        userId,
        totalXp,
        currentLevel,
        tasksCompleted,
        onTimeCount,
        totalTasksWithDeadline,
        Math.round(avgQualityRating * 100) / 100
      ).run()

      // g. Check and award badges
      const allBadges = await env.DB.prepare('SELECT * FROM badges').all()
      const existingBadges = await env.DB.prepare(
        'SELECT badge_id FROM user_badges WHERE user_id = ?'
      ).bind(userId).all()
      const earnedBadgeIds = new Set((existingBadges.results || []).map(b => b.badge_id))

      // Pre-fetch data needed for badge checks
      const hoursResult = await env.DB.prepare(
        'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM time_entries WHERE user_id = ?'
      ).bind(userId).first()
      const totalHoursMinutes = hoursResult.total

      // No-revision streak: count tasks with no 'revision' in task_history
      const noRevisionResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM tasks t
        WHERE t.contractor_id = ?
          AND t.status = 'closed'
          AND NOT EXISTS (
            SELECT 1 FROM task_history th
            WHERE th.task_id = t.id AND th.to_status = 'revision'
          )
      `).bind(userId).first()
      const noRevisionCount = noRevisionResult.count

      for (const badge of (allBadges.results || [])) {
        if (earnedBadgeIds.has(badge.id)) continue

        let shouldAward = false

        switch (badge.criteria_type) {
          case 'tasks_completed':
            shouldAward = tasksCompleted >= badge.criteria_value
            break
          case 'quality_rating':
            // Award if any admin review for contractor's tasks has quality_rating >= criteria_value
            {
              const qualityCheck = await env.DB.prepare(`
                SELECT COUNT(*) as count
                FROM task_reviews tr
                JOIN tasks t ON tr.task_id = t.id
                WHERE t.contractor_id = ?
                  AND tr.reviewer_role = 'admin'
                  AND tr.quality_rating >= ?
              `).bind(userId, badge.criteria_value).first()
              shouldAward = qualityCheck.count > 0
            }
            break
          case 'hours_logged':
            shouldAward = totalHoursMinutes >= badge.criteria_value
            break
          case 'on_time_streak':
            shouldAward = onTimeCount >= badge.criteria_value
            break
          case 'under_estimated':
            shouldAward = underEstimatedCount >= badge.criteria_value
            break
          case 'no_revision_streak':
            shouldAward = noRevisionCount >= badge.criteria_value
            break
          case 'review_streak':
            shouldAward = reviewsCompleted >= badge.criteria_value
            break
        }

        if (shouldAward) {
          await env.DB.prepare(
            "INSERT INTO user_badges (user_id, badge_id, awarded_at) VALUES (?, ?, datetime('now'))"
          ).bind(userId, badge.id).run()
        }
      }

      // h. Return updated XP profile
      const updatedXp = await env.DB.prepare(
        'SELECT * FROM contractor_xp WHERE user_id = ?'
      ).bind(userId).first()

      const currentLevelDetails = await env.DB.prepare(
        'SELECT * FROM xp_levels WHERE level = ?'
      ).bind(updatedXp.current_level).first()

      const nextLevel = await env.DB.prepare(
        'SELECT * FROM xp_levels WHERE level = ?'
      ).bind(updatedXp.current_level + 1).first()

      // Get newly earned badges
      const updatedBadges = await env.DB.prepare(`
        SELECT b.*, ub.awarded_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.awarded_at DESC
      `).bind(userId).all()

      return jsonResponse({
        success: true,
        data: {
          ...updatedXp,
          current_level_details: currentLevelDetails,
          next_level: nextLevel || null,
          xp_to_next_level: nextLevel
            ? nextLevel.xp_threshold - updatedXp.total_xp
            : null,
          badges: updatedBadges.results || [],
        },
      })
    } catch (err) {
      console.error('Recalculate XP error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to recalculate XP' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
