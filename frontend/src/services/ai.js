/**
 * AI Service — Workers AI Abstraction Layer
 *
 * Phase 1D: One test case integration (task summary, categorisation, or brief analysis).
 * Phase 3: Full AI expansion (assignment, predictions, suggestions, reminders).
 *
 * All AI operations go through this service.
 * UI → API → AI → store → display
 */

import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from './auth'

/**
 * Analyse a task brief and return AI insights
 * @param {string} taskId - Task ID to analyse
 * @returns {Promise<object>} AI analysis result
 */
export async function analyseTaskBrief(taskId) {
  const res = await fetch(apiEndpoint(`/ai/analyse-brief/${taskId}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'AI analysis failed')
  return data.data
}

/**
 * Generate a task summary from description
 * @param {string} description - Task description text
 * @returns {Promise<object>} Summary result
 */
export async function summariseTask(description) {
  const res = await fetch(apiEndpoint('/ai/summarise'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ description }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'AI summarisation failed')
  return data.data
}

/**
 * Suggest a category for a task based on title and description
 * @param {string} title
 * @param {string} description
 * @returns {Promise<object>} Suggested category
 */
export async function suggestCategory(title, description) {
  const res = await fetch(apiEndpoint('/ai/suggest-category'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ title, description }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'AI suggestion failed')
  return data.data
}

const aiService = {
  analyseTaskBrief,
  summariseTask,
  suggestCategory,
}

export default aiService
