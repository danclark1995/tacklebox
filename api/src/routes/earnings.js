/**
 * Earnings Routes — Earnings ledger, balance, rewards, cashout
 * GET /earnings/me — current user's earnings history + balance
 * GET /earnings/:userId — admin view of a user's earnings
 * POST /earnings/reward — camp leader / admin award bonus XP or cash
 * POST /earnings/cashout — request a cashout
 * GET /earnings/cashouts — admin list all cashout requests
 * PATCH /earnings/cashouts/:id — admin process a cashout
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { createNotification } from './notifications.js'

export async function handleEarnings(request, env, auth, path, method) {

  // ── GET /earnings/me ─────────────────────────────────────────────
  if (path === '/earnings/me' && method === 'GET') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const userId = auth.user.id
    try {
      const earnings = await env.DB.prepare(`
        SELECT e.*, t.title as task_title, u.display_name as awarded_by_name
        FROM earnings e
        LEFT JOIN tasks t ON e.task_id = t.id
        LEFT JOIN users u ON e.awarded_by = u.id
        WHERE e.user_id = ?
        ORDER BY e.created_at DESC
        LIMIT 100
      `).bind(userId).first() ? await env.DB.prepare(`
        SELECT e.*, t.title as task_title, u.display_name as awarded_by_name
        FROM earnings e
        LEFT JOIN tasks t ON e.task_id = t.id
        LEFT JOIN users u ON e.awarded_by = u.id
        WHERE e.user_id = ?
        ORDER BY e.created_at DESC
        LIMIT 100
      `).bind(userId).all() : { results: [] }

      const balance = await env.DB.prepare(
        'SELECT total_earnings, available_balance FROM contractor_xp WHERE user_id = ?'
      ).bind(userId).first()

      const cashouts = await env.DB.prepare(`
        SELECT * FROM cashout_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
      `).bind(userId).all()

      return jsonResponse({
        success: true,
        data: {
          earnings: earnings.results || [],
          total_earnings: balance?.total_earnings || 0,
          available_balance: balance?.available_balance || 0,
          cashouts: cashouts.results || [],
        }
      })
    } catch (err) {
      console.error('Get my earnings error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch earnings' }, 500)
    }
  }

  // ── GET /earnings/:userId — admin view ───────────────────────────
  const userMatch = path.match(/^\/earnings\/([^\/]+)$/)
  if (userMatch && method === 'GET' && userMatch[1] !== 'me' && userMatch[1] !== 'cashouts') {
    const check = requireRole(auth, 'admin')
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const userId = userMatch[1]
    try {
      const earnings = await env.DB.prepare(`
        SELECT e.*, t.title as task_title, u.display_name as awarded_by_name
        FROM earnings e
        LEFT JOIN tasks t ON e.task_id = t.id
        LEFT JOIN users u ON e.awarded_by = u.id
        WHERE e.user_id = ?
        ORDER BY e.created_at DESC
        LIMIT 100
      `).bind(userId).all()

      const balance = await env.DB.prepare(
        'SELECT total_earnings, available_balance FROM contractor_xp WHERE user_id = ?'
      ).bind(userId).first()

      return jsonResponse({
        success: true,
        data: {
          earnings: earnings.results || [],
          total_earnings: balance?.total_earnings || 0,
          available_balance: balance?.available_balance || 0,
        }
      })
    } catch (err) {
      console.error('Get user earnings error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch earnings' }, 500)
    }
  }

  // ── POST /earnings/reward — camp leader (7+) or admin award bonus ─
  if (path === '/earnings/reward' && method === 'POST') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const user = auth.user
    // Must be admin or contractor level 7+
    if (user.role === 'contractor') {
      const xp = await env.DB.prepare(
        'SELECT current_level FROM contractor_xp WHERE user_id = ?'
      ).bind(user.id).first()
      if (!xp || xp.current_level < 7) {
        return jsonResponse({ success: false, error: 'Camp Leader rank (level 7+) required' }, 403)
      }
    } else if (user.role !== 'admin') {
      return jsonResponse({ success: false, error: 'Insufficient permissions' }, 403)
    }

    try {
      const body = await request.json()
      const { target_user_id, type, amount, xp_amount, description } = body

      if (!target_user_id || !type || !description) {
        return jsonResponse({ success: false, error: 'target_user_id, type, and description required' }, 400)
      }
      if (!['bonus_cash', 'bonus_xp'].includes(type)) {
        return jsonResponse({ success: false, error: 'type must be bonus_cash or bonus_xp' }, 400)
      }
      if (type === 'bonus_cash' && (!amount || amount <= 0)) {
        return jsonResponse({ success: false, error: 'amount must be positive for cash bonus' }, 400)
      }
      if (type === 'bonus_xp' && (!xp_amount || xp_amount <= 0)) {
        return jsonResponse({ success: false, error: 'xp_amount must be positive for XP bonus' }, 400)
      }

      // Verify target user exists and is a contractor
      const target = await env.DB.prepare(
        'SELECT id, role FROM users WHERE id = ? AND is_active = 1'
      ).bind(target_user_id).first()
      if (!target || target.role !== 'contractor') {
        return jsonResponse({ success: false, error: 'Target user not found or not a camper' }, 404)
      }

      const earningId = crypto.randomUUID()
      const cashAmount = type === 'bonus_cash' ? amount : 0
      const xpAmt = type === 'bonus_xp' ? xp_amount : 0

      await env.DB.prepare(`
        INSERT INTO earnings (id, user_id, type, amount, xp_amount, description, awarded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(earningId, target_user_id, type, cashAmount, xpAmt, description, user.id).run()

      // Update cached balances
      if (cashAmount > 0) {
        await env.DB.prepare(`
          UPDATE contractor_xp 
          SET total_earnings = total_earnings + ?, available_balance = available_balance + ?, updated_at = datetime('now')
          WHERE user_id = ?
        `).bind(cashAmount, cashAmount, target_user_id).run()
      }

      if (xpAmt > 0) {
        // Add XP and recalculate level
        const xpData = await env.DB.prepare(
          'SELECT total_xp, current_level FROM contractor_xp WHERE user_id = ?'
        ).bind(target_user_id).first()

        if (xpData) {
          const newTotalXp = xpData.total_xp + xpAmt
          const newLevel = await env.DB.prepare(
            'SELECT level FROM xp_levels WHERE xp_required <= ? ORDER BY level DESC LIMIT 1'
          ).bind(newTotalXp).first()

          await env.DB.prepare(`
            UPDATE contractor_xp SET total_xp = ?, current_level = ?, updated_at = datetime('now')
            WHERE user_id = ?
          `).bind(newTotalXp, newLevel?.level || xpData.current_level, target_user_id).run()
        }
      }

      // Notify camper of bonus
      try {
        const bonusLabel = type === 'bonus_cash' ? `$${cashAmount}` : `${xpAmt} XP`
        await createNotification(env.DB, target_user_id, 'bonus',
          'Bonus Awarded!',
          `You received a ${bonusLabel} bonus${description ? ': ' + description : ''}.`,
          '/camper/earnings')
      } catch (e) { /* non-critical */ }

      return jsonResponse({
        success: true,
        data: { id: earningId, type, amount: cashAmount, xp_amount: xpAmt }
      })
    } catch (err) {
      console.error('Reward error:', err)
      return jsonResponse({ success: false, error: 'Failed to award bonus' }, 500)
    }
  }

  // ── POST /earnings/cashout — request cashout ─────────────────────
  if (path === '/earnings/cashout' && method === 'POST') {
    const check = requireAuth(auth)
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    if (auth.user.role !== 'contractor') {
      return jsonResponse({ success: false, error: 'Only campers can request cashouts' }, 403)
    }

    try {
      const body = await request.json()
      const { amount } = body

      if (!amount || amount <= 0) {
        return jsonResponse({ success: false, error: 'Amount must be positive' }, 400)
      }

      // Check available balance
      const balance = await env.DB.prepare(
        'SELECT available_balance FROM contractor_xp WHERE user_id = ?'
      ).bind(auth.user.id).first()

      if (!balance || balance.available_balance < amount) {
        return jsonResponse({ success: false, error: 'Insufficient balance' }, 400)
      }

      const cashoutId = crypto.randomUUID()
      await env.DB.prepare(`
        INSERT INTO cashout_requests (id, user_id, amount) VALUES (?, ?, ?)
      `).bind(cashoutId, auth.user.id, amount).run()

      // Deduct from available balance (held until processed)
      await env.DB.prepare(`
        UPDATE contractor_xp SET available_balance = available_balance - ?, updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(amount, auth.user.id).run()

      return jsonResponse({
        success: true,
        data: { id: cashoutId, amount, status: 'pending' }
      })
    } catch (err) {
      console.error('Cashout request error:', err)
      return jsonResponse({ success: false, error: 'Failed to create cashout request' }, 500)
    }
  }

  // ── GET /earnings/cashouts — admin list all ──────────────────────
  if (path === '/earnings/cashouts' && method === 'GET') {
    const check = requireRole(auth, 'admin')
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    try {
      const result = await env.DB.prepare(`
        SELECT cr.*, u.display_name, u.email
        FROM cashout_requests cr
        JOIN users u ON cr.user_id = u.id
        ORDER BY cr.created_at DESC
        LIMIT 100
      `).all()

      return jsonResponse({ success: true, data: result.results || [] })
    } catch (err) {
      console.error('List cashouts error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch cashouts' }, 500)
    }
  }

  // ── PATCH /earnings/cashouts/:id — admin process cashout ─────────
  const cashoutMatch = path.match(/^\/earnings\/cashouts\/([^\/]+)$/)
  if (cashoutMatch && method === 'PATCH') {
    const check = requireRole(auth, 'admin')
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    const cashoutId = cashoutMatch[1]
    try {
      const body = await request.json()
      const { status, note } = body

      if (!['completed', 'rejected'].includes(status)) {
        return jsonResponse({ success: false, error: 'Status must be completed or rejected' }, 400)
      }

      const cashout = await env.DB.prepare(
        'SELECT * FROM cashout_requests WHERE id = ?'
      ).bind(cashoutId).first()

      if (!cashout) return jsonResponse({ success: false, error: 'Cashout not found' }, 404)
      if (cashout.status !== 'pending') {
        return jsonResponse({ success: false, error: 'Cashout already processed' }, 400)
      }

      await env.DB.prepare(`
        UPDATE cashout_requests 
        SET status = ?, note = ?, processed_at = datetime('now'), processed_by = ?
        WHERE id = ?
      `).bind(status, note || null, auth.user.id, cashoutId).run()

      // If rejected, return the held amount to available balance
      if (status === 'rejected') {
        await env.DB.prepare(`
          UPDATE contractor_xp SET available_balance = available_balance + ?, updated_at = datetime('now')
          WHERE user_id = ?
        `).bind(cashout.amount, cashout.user_id).run()
      }

      return jsonResponse({ success: true, data: { id: cashoutId, status } })
    } catch (err) {
      console.error('Process cashout error:', err)
      return jsonResponse({ success: false, error: 'Failed to process cashout' }, 500)
    }
  }

  // ── GET /earnings/analytics — task level/type breakdown for admin ─
  if (path === '/earnings/analytics' && method === 'GET') {
    const check = requireRole(auth, 'admin')
    if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

    try {
      // Task breakdown by level
      const byLevel = await env.DB.prepare(`
        SELECT 
          COALESCE(t.min_level, 1) as level,
          xl.name as level_name,
          COUNT(*) as total_tasks,
          SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN t.status IN ('submitted','assigned','in_progress','review','revision') THEN 1 ELSE 0 END) as active,
          ROUND(SUM(COALESCE(t.total_payout, 0)), 2) as total_value,
          ROUND(AVG(COALESCE(t.estimated_hours, 0)), 1) as avg_hours
        FROM tasks t
        LEFT JOIN xp_levels xl ON COALESCE(t.min_level, 1) = xl.level
        GROUP BY COALESCE(t.min_level, 1)
        ORDER BY level ASC
      `).all()

      // Task breakdown by category
      const byCategory = await env.DB.prepare(`
        SELECT 
          cat.name as category_name,
          COUNT(*) as total_tasks,
          SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) as completed,
          ROUND(SUM(COALESCE(t.total_payout, 0)), 2) as total_value,
          ROUND(AVG(COALESCE(t.estimated_hours, 0)), 1) as avg_hours
        FROM tasks t
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        GROUP BY t.category_id
        ORDER BY total_tasks DESC
      `).all()

      // By client
      const byClient = await env.DB.prepare(`
        SELECT 
          u.display_name as client_name,
          u.company,
          COUNT(*) as total_tasks,
          SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) as completed,
          ROUND(SUM(COALESCE(t.total_payout, 0)), 2) as total_value
        FROM tasks t
        JOIN users u ON t.client_id = u.id
        GROUP BY t.client_id
        ORDER BY total_tasks DESC
      `).all()

      // Total earnings distributed
      const earningsSummary = await env.DB.prepare(`
        SELECT 
          SUM(CASE WHEN type = 'task_completion' THEN amount ELSE 0 END) as task_earnings,
          SUM(CASE WHEN type = 'bonus_cash' THEN amount ELSE 0 END) as bonus_earnings,
          SUM(xp_amount) as total_bonus_xp,
          COUNT(DISTINCT user_id) as unique_earners,
          ROUND(SUM(COALESCE(campsite_share, 0)), 2) as total_campsite_share,
          ROUND(SUM(COALESCE(camper_share, 0)), 2) as total_camper_share
        FROM earnings
      `).first()

      return jsonResponse({
        success: true,
        data: {
          by_level: byLevel.results || [],
          by_category: byCategory.results || [],
          by_client: byClient.results || [],
          earnings_summary: earningsSummary || {},
        }
      })
    } catch (err) {
      console.error('Earnings analytics error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch analytics' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
