/**
 * Analytics Service — Abstraction Layer
 *
 * Fetches aggregated data for the admin analytics dashboard.
 */

import { apiFetch } from './apiFetch'

function buildQuery(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value)
    }
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function getTaskOverview(filters = {}) {
  const data = await apiFetch(`/analytics/tasks${buildQuery(filters)}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch task analytics')
  return data.data
}

export async function getTurnaround(filters = {}) {
  const data = await apiFetch(`/analytics/turnaround${buildQuery(filters)}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch turnaround analytics')
  return data.data
}

export async function getCategoryBreakdown(filters = {}) {
  const data = await apiFetch(`/analytics/categories${buildQuery(filters)}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch category analytics')
  return data.data
}

export async function getProjectProgress(filters = {}) {
  const data = await apiFetch(`/analytics/projects${buildQuery(filters)}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch project analytics')
  return data.data
}

export async function getContractorPerformance(filters = {}) {
  const data = await apiFetch(`/analytics/contractors${buildQuery(filters)}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch contractor analytics')
  return data.data
}

export async function getTimeTracking(filters = {}) {
  const data = await apiFetch(`/analytics/time${buildQuery(filters)}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch time analytics')
  return data.data
}

export async function getReviewInsights(filters = {}) {
  const data = await apiFetch(`/analytics/reviews${buildQuery(filters)}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch review analytics')
  return data.data
}

const analyticsService = {
  getTaskOverview,
  getTurnaround,
  getCategoryBreakdown,
  getProjectProgress,
  getContractorPerformance,
  getTimeTracking,
  getReviewInsights,
}

export default analyticsService
