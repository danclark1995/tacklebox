/**
 * Credits Service
 *
 * Client credit balance, packs, purchases, and transactions.
 */

import { apiFetch } from './apiFetch'

export async function getMyCredits() {
  const data = await apiFetch('/credits/me')
  if (!data.success) throw new Error(data.error || 'Failed to fetch credits')
  return data.data
}

export async function listPacks() {
  const data = await apiFetch('/credits/packs')
  if (!data.success) throw new Error(data.error || 'Failed to fetch packs')
  return data.data
}

export async function purchasePack(packId, paymentMethod) {
  const data = await apiFetch('/credits/purchase', {
    method: 'POST',
    body: JSON.stringify({ pack_id: packId, payment_method: paymentMethod }),
  })
  if (!data.success) throw new Error(data.error || 'Failed to purchase pack')
  return data.data
}

export async function getTransactions() {
  const data = await apiFetch('/credits/transactions')
  if (!data.success) throw new Error(data.error || 'Failed to fetch transactions')
  return data.data
}

export async function getClientCredits(userId) {
  const data = await apiFetch(`/credits/${userId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch client credits')
  return data.data
}

export async function grantCredits(userId, amount, reason) {
  const data = await apiFetch('/credits/grant', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, amount, reason }),
  })
  if (!data.success) throw new Error(data.error || 'Failed to grant credits')
  return data.data
}
