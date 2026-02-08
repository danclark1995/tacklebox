/**
 * Search Service — Abstraction Layer
 *
 * Global search across tasks, users, brand guides, and projects.
 * Respects role-based permissions (server-side filtering).
 *
 * Phase 1: D1 LIKE queries.
 * Future: Full-text search index if needed for scale.
 */

import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from './auth'
import { SEARCH_DEBOUNCE_MS } from '@/config/constants'

/**
 * Global search across all entity types
 * @param {string} query - Search query
 * @param {object} options - { type, limit, offset }
 * @returns {Promise<object>} Search results grouped by type with counts
 */
export async function search(query, options = {}) {
  if (!query || query.trim().length === 0) {
    return { tasks: [], users: [], brandGuides: [], projects: [], total: 0 }
  }

  const params = new URLSearchParams({ q: query.trim() })
  if (options.type) params.append('type', options.type)
  if (options.limit) params.append('limit', options.limit)
  if (options.offset) params.append('offset', options.offset)

  const res = await fetch(apiEndpoint(`/search?${params.toString()}`), {
    headers: { ...getAuthHeaders() },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Search failed')
  return data.data
}

/**
 * Search tasks only
 * @param {string} query
 * @param {object} filters - { status, priority, categoryId, projectId }
 */
export async function searchTasks(query, filters = {}) {
  return search(query, { type: 'tasks', ...filters })
}

/**
 * Search users only
 * @param {string} query
 */
export async function searchUsers(query) {
  return search(query, { type: 'users' })
}

/**
 * Search brand guides only
 * @param {string} query
 */
export async function searchBrandGuides(query) {
  return search(query, { type: 'brand_guides' })
}

/**
 * Search projects only
 * @param {string} query
 */
export async function searchProjects(query) {
  return search(query, { type: 'projects' })
}

/**
 * Create a debounced search function
 * @param {function} callback - Function to call with results
 * @param {number} delay - Debounce delay in ms (default from constants)
 * @returns {function} Debounced search function
 */
export function createDebouncedSearch(callback, delay = SEARCH_DEBOUNCE_MS) {
  let timeoutId = null
  return (query, options = {}) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(async () => {
      try {
        const results = await search(query, options)
        callback(results, null)
      } catch (err) {
        callback(null, err)
      }
    }, delay)
  }
}

const searchService = {
  search,
  searchTasks,
  searchUsers,
  searchBrandGuides,
  searchProjects,
  createDebouncedSearch,
}

export default searchService
