/**
 * Gamification Service — Abstraction Layer
 *
 * Manages XP, levels, badges, and leaderboard data.
 */

import { apiFetch } from './apiFetch'

export async function getMyGamification() {
  const data = await apiFetch('/gamification/me')
  if (!data.success) throw new Error(data.error || 'Failed to fetch gamification data')
  return data.data
}

export async function getContractorXP(userId) {
  const data = await apiFetch(`/gamification/xp/${userId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch XP')
  return data.data
}

export async function getLevels() {
  const data = await apiFetch('/gamification/levels')
  if (!data.success) throw new Error(data.error || 'Failed to fetch levels')
  return data.data
}

export async function getBadges(userId) {
  const data = await apiFetch(`/gamification/badges/${userId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch badges')
  return data.data
}

export async function getLeaderboard(limit = 10) {
  const data = await apiFetch(`/gamification/leaderboard?limit=${limit}`)
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
