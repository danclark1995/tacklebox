/**
 * Earnings Service
 *
 * Camper earnings, cashouts, bonuses, and analytics.
 */

import { apiFetch } from './apiFetch'

export async function getMyEarnings() {
  const data = await apiFetch('/earnings/me')
  if (!data.success) throw new Error(data.error || 'Failed to fetch earnings')
  return data.data
}

export async function getEarnings(userId) {
  const data = await apiFetch(`/earnings/${userId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch earnings')
  return data.data
}

export async function requestCashout(amount, method) {
  const data = await apiFetch('/earnings/cashout', {
    method: 'POST',
    body: JSON.stringify({ amount, method }),
  })
  if (!data.success) throw new Error(data.error || 'Failed to request cashout')
  return data.data
}

export async function listCashouts() {
  const data = await apiFetch('/earnings/cashouts')
  if (!data.success) throw new Error(data.error || 'Failed to fetch cashouts')
  return data.data
}

export async function updateCashout(id, status) {
  const data = await apiFetch(`/earnings/cashouts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update cashout')
  return data.data
}

export async function awardBonus(body) {
  const data = await apiFetch('/earnings/reward', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to award bonus')
  return data.data
}

export async function getAnalytics() {
  const data = await apiFetch('/earnings/analytics')
  if (!data.success) throw new Error(data.error || 'Failed to fetch earnings analytics')
  return data.data
}
