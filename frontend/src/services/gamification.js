/**
 * Gamification Service — Abstraction Layer
 *
 * Manages XP, levels, badges, and leaderboard data.
 * All gamification values stored in database — tune without code changes.
 *
 * Phase 1D: Full implementation.
 * Phase 3: AI-enhanced predictions and suggestions.
 */

import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from './auth'

/**
 * Get contractor XP and level info
 * @param {string} userId - Contractor user ID
 * @returns {Promise<object>} XP data including total_xp, current_level, stats
 */
export async function getContractorXP(userId) {
  const res = await fetch(apiEndpoint(`/gamification/xp/${userId}`), {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch XP')
  return data.data
}

/**
 * Get all XP levels and thresholds
 * @returns {Promise<object[]>} Array of level definitions
 */
export async function getLevels() {
  const res = await fetch(apiEndpoint('/gamification/levels'), {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch levels')
  return data.data
}

/**
 * Get badges for a contractor (earned and available)
 * @param {string} userId
 * @returns {Promise<object>} { earned: [], available: [] }
 */
export async function getBadges(userId) {
  const res = await fetch(apiEndpoint(`/gamification/badges/${userId}`), {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch badges')
  return data.data
}

/**
 * Get leaderboard data
 * @param {number} limit - Number of entries (default 10)
 * @returns {Promise<object[]>} Leaderboard entries
 */
export async function getLeaderboard(limit = 10) {
  const res = await fetch(apiEndpoint(`/gamification/leaderboard?limit=${limit}`), {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch leaderboard')
  return data.data
}

const gamificationService = {
  getContractorXP,
  getLevels,
  getBadges,
  getLeaderboard,
}

export default gamificationService
