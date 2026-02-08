/**
 * Analytics Service — Abstraction Layer
 *
 * Fetches aggregated data for the admin analytics dashboard.
 * All 7 sections from Section 14 of the spec.
 *
 * Phase 1D: Full implementation.
 * Phase 3: AI-enhanced trends and forecasting.
 */

import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from './auth'

/**
 * Build query string from filters
 */
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

/**
 * Fetch task overview analytics
 * Volume over time, status distribution, avg time per state
 */
export async function getTaskOverview(filters = {}) {
  const res = await fetch(apiEndpoint(`/analytics/tasks${buildQuery(filters)}`), {
    headers: { ...getAuthHeaders() },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch task analytics')
  return data.data
}

/**
 * Fetch turnaround analytics
 * Created→closed avg, trend, per priority
 */
export async function getTurnaround(filters = {}) {
  const res = await fetch(apiEndpoint(`/analytics/turnaround${buildQuery(filters)}`), {
    headers: { ...getAuthHeaders() },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch turnaround analytics')
  return data.data
}

/**
 * Fetch category breakdown analytics
 * Tasks per category, avg time, avg quality
 */
export async function getCategoryBreakdown(filters = {}) {
  const res = await fetch(apiEndpoint(`/analytics/categories${buildQuery(filters)}`), {
    headers: { ...getAuthHeaders() },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch category analytics')
  return data.data
}

/**
 * Fetch project progress analytics
 * Completion %, time invested, active vs completed
 */
export async function getProjectProgress(filters = {}) {
  const res = await fetch(apiEndpoint(`/analytics/projects${buildQuery(filters)}`), {
    headers: { ...getAuthHeaders() },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch project analytics')
  return data.data
}

/**
 * Fetch contractor performance analytics
 * Table: name, tasks, on-time %, quality avg, time avg, level
 */
export async function getContractorPerformance(filters = {}) {
  const res = await fetch(apiEndpoint(`/analytics/contractors${buildQuery(filters)}`), {
    headers: { ...getAuthHeaders() },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch contractor analytics')
  return data.data
}

/**
 * Fetch time tracking analytics
 * Total hours, by contractor/client/category, avg per task type
 */
export async function getTimeTracking(filters = {}) {
  const res = await fetch(apiEndpoint(`/analytics/time${buildQuery(filters)}`), {
    headers: { ...getAuthHeaders() },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch time analytics')
  return data.data
}

/**
 * Fetch review insights analytics
 * Completion rate, avg difficulty, avg quality
 */
export async function getReviewInsights(filters = {}) {
  const res = await fetch(apiEndpoint(`/analytics/reviews${buildQuery(filters)}`), {
    headers: { ...getAuthHeaders() },
  })
  const data = await res.json()
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
