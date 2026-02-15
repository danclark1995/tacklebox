/**
 * Credits Routes
 * GET /credits/me - client's credit balance
 * GET /credits/packs - available credit packs
 * GET /credits/transactions - client's transaction history
 * GET /credits/:userId - admin view of client balance + transactions
 * POST /credits/purchase - purchase a credit pack (Stripe-ready)
 * POST /credits/grant - admin grants credits to a client
 */

import { jsonResponse } from '../index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { createNotification } from './notifications.js'

/**
 * Helper: get or create credit balance for a user
 */
async function getOrCreateBalance(db, userId) {
  let balance = await db.prepare(
    'SELECT * FROM client_credits WHERE user_id = ?'
  ).bind(userId).first()

  if (!balance) {
    await db.prepare(
      'INSERT INTO client_credits (user_id) VALUES (?)'
    ).bind(userId).run()
    balance = { user_id: userId, total_credits: 0, available_credits: 0, held_credits: 0 }
  }

  return balance
}

/**
 * Helper: record a credit transaction
 */
async function recordTransaction(db, userId, type, amount, balanceAfter, opts = {}) {
  const id = crypto.randomUUID()
  await db.prepare(`
    INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, task_id, pack_id, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, type, amount, balanceAfter,
    opts.taskId || null, opts.packId || null, opts.description || null, opts.createdBy || null
  ).run()
  return id
}

/**
 * Helper: hold credits for a task (called from tasks.js on task creation)
 * Returns { success, error? }
 */
export async function holdCreditsForTask(db, clientId, creditCost, taskId) {
  const balance = await getOrCreateBalance(db, clientId)

  if (balance.available_credits < creditCost) {
    return {
      success: false,
      error: `Insufficient credits. Need ${creditCost}, have ${balance.available_credits} available.`,
      available: balance.available_credits,
      needed: creditCost,
    }
  }

  const newAvailable = Math.round((balance.available_credits - creditCost) * 100) / 100
  const newHeld = Math.round((balance.held_credits + creditCost) * 100) / 100

  await db.prepare(`
    UPDATE client_credits
    SET available_credits = ?, held_credits = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).bind(newAvailable, newHeld, clientId).run()

  await recordTransaction(db, clientId, 'task_hold', -creditCost, newAvailable, {
    taskId,
    description: `Credits held for task`,
  })

  return { success: true, available: newAvailable, held: newHeld }
}

/**
 * Helper: finalize held credits when task closes (deduct from held)
 */
export async function finalizeCredits(db, clientId, creditCost, taskId) {
  const balance = await getOrCreateBalance(db, clientId)
  const newHeld = Math.round(Math.max(0, balance.held_credits - creditCost) * 100) / 100

  await db.prepare(`
    UPDATE client_credits SET held_credits = ?, updated_at = datetime('now') WHERE user_id = ?
  `).bind(newHeld, clientId).run()

  await recordTransaction(db, clientId, 'task_deduct', -creditCost, balance.available_credits, {
    taskId,
    description: `Credits finalized for completed task`,
  })

  return { success: true }
}

/**
 * Helper: release held credits (task cancelled/refunded)
 */
export async function releaseCredits(db, clientId, creditCost, taskId) {
  const balance = await getOrCreateBalance(db, clientId)
  const newAvailable = Math.round((balance.available_credits + creditCost) * 100) / 100
  const newHeld = Math.round(Math.max(0, balance.held_credits - creditCost) * 100) / 100

  await db.prepare(`
    UPDATE client_credits SET available_credits = ?, held_credits = ?, updated_at = datetime('now') WHERE user_id = ?
  `).bind(newAvailable, newHeld, clientId).run()

  await recordTransaction(db, clientId, 'task_release', creditCost, newAvailable, {
    taskId,
    description: `Credits released — task cancelled`,
  })

  return { success: true, available: newAvailable }
}


export async function handleCredits(request, env, auth, path, method) {

  // GET /credits/me - client's own balance
  if (path === '/credits/me' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const balance = await getOrCreateBalance(env.DB, auth.user.id)

      // Get recent transactions
      const transactions = await env.DB.prepare(`
        SELECT ct.*, cp.name as pack_name, t.title as task_title
        FROM credit_transactions ct
        LEFT JOIN credit_packs cp ON ct.pack_id = cp.id
        LEFT JOIN tasks t ON ct.task_id = t.id
        WHERE ct.user_id = ?
        ORDER BY ct.created_at DESC
        LIMIT 50
      `).bind(auth.user.id).all()

      return jsonResponse({
        success: true,
        data: {
          ...balance,
          transactions: transactions.results || [],
        },
      })
    } catch (err) {
      console.error('Get credits error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch credit balance' }, 500)
    }
  }

  // GET /credits/packs - available credit packs
  if (path === '/credits/packs' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const packs = await env.DB.prepare(
        'SELECT * FROM credit_packs WHERE is_active = 1 ORDER BY tier ASC'
      ).all()

      return jsonResponse({ success: true, data: packs.results || [] })
    } catch (err) {
      console.error('Get packs error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch credit packs' }, 500)
    }
  }

  // POST /credits/purchase - purchase a credit pack (Stripe-ready)
  if (path === '/credits/purchase' && method === 'POST') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    if (auth.user.role !== 'client') {
      return jsonResponse({ success: false, error: 'Only clients can purchase credit packs' }, 403)
    }

    try {
      const body = await request.json()
      const { pack_id, stripe_payment_id } = body

      if (!pack_id) {
        return jsonResponse({ success: false, error: 'pack_id is required' }, 400)
      }

      const pack = await env.DB.prepare(
        'SELECT * FROM credit_packs WHERE id = ? AND is_active = 1'
      ).bind(pack_id).first()

      if (!pack) {
        return jsonResponse({ success: false, error: 'Invalid or inactive credit pack' }, 404)
      }

      // TODO: Verify Stripe payment when integrated
      // For now, purchase is recorded immediately

      const balance = await getOrCreateBalance(env.DB, auth.user.id)
      const newTotal = Math.round((balance.total_credits + pack.credits) * 100) / 100
      const newAvailable = Math.round((balance.available_credits + pack.credits) * 100) / 100

      await env.DB.prepare(`
        UPDATE client_credits
        SET total_credits = ?, available_credits = ?, updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(newTotal, newAvailable, auth.user.id).run()

      await recordTransaction(env.DB, auth.user.id, 'purchase', pack.credits, newAvailable, {
        packId: pack.id,
        description: `Purchased ${pack.name} pack (${pack.credits} credits)`,
        createdBy: auth.user.id,
      })

      return jsonResponse({
        success: true,
        data: {
          credits_added: pack.credits,
          new_balance: newAvailable,
          pack: pack.name,
          stripe_payment_id: stripe_payment_id || null,
        },
      }, 201)
    } catch (err) {
      console.error('Purchase credits error:', err)
      return jsonResponse({ success: false, error: 'Failed to process purchase' }, 500)
    }
  }

  // POST /credits/grant - admin grants credits to a client
  if (path === '/credits/grant' && method === 'POST') {
    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const body = await request.json()
      const { user_id, amount, description } = body

      if (!user_id || !amount || amount <= 0) {
        return jsonResponse({ success: false, error: 'user_id and positive amount are required' }, 400)
      }

      // Verify user is a client
      const client = await env.DB.prepare(
        'SELECT id, display_name FROM users WHERE id = ? AND role = "client"'
      ).bind(user_id).first()

      if (!client) {
        return jsonResponse({ success: false, error: 'User not found or is not a client' }, 404)
      }

      const balance = await getOrCreateBalance(env.DB, user_id)
      const newTotal = Math.round((balance.total_credits + amount) * 100) / 100
      const newAvailable = Math.round((balance.available_credits + amount) * 100) / 100

      await env.DB.prepare(`
        UPDATE client_credits
        SET total_credits = ?, available_credits = ?, updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(newTotal, newAvailable, user_id).run()

      await recordTransaction(env.DB, user_id, 'admin_grant', amount, newAvailable, {
        description: description || 'Admin credit grant',
        createdBy: auth.user.id,
      })

      // Notify client
      await createNotification(
        env.DB, user_id, 'system',
        'Credits Added',
        `${amount} credits have been added to your account${description ? ': ' + description : ''}.`,
        '/client/credits'
      )

      return jsonResponse({
        success: true,
        data: {
          user_id,
          display_name: client.display_name,
          credits_added: amount,
          new_balance: newAvailable,
        },
      })
    } catch (err) {
      console.error('Grant credits error:', err)
      return jsonResponse({ success: false, error: 'Failed to grant credits' }, 500)
    }
  }

  // GET /credits/:userId - admin view of client balance
  const userMatch = path.match(/^\/credits\/([^\/]+)$/)
  if (userMatch && method === 'GET') {
    const userId = userMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.status)
    }

    try {
      const balance = await getOrCreateBalance(env.DB, userId)

      const transactions = await env.DB.prepare(`
        SELECT ct.*, cp.name as pack_name, t.title as task_title,
          u.display_name as created_by_name
        FROM credit_transactions ct
        LEFT JOIN credit_packs cp ON ct.pack_id = cp.id
        LEFT JOIN tasks t ON ct.task_id = t.id
        LEFT JOIN users u ON ct.created_by = u.id
        WHERE ct.user_id = ?
        ORDER BY ct.created_at DESC
        LIMIT 100
      `).bind(userId).all()

      return jsonResponse({
        success: true,
        data: {
          ...balance,
          transactions: transactions.results || [],
        },
      })
    } catch (err) {
      console.error('Get client credits error:', err)
      return jsonResponse({ success: false, error: 'Failed to fetch client credits' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
