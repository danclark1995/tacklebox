/**
 * API Router — All routes under /api/v1/
 */

import { jsonResponse } from '../index.js'
import { authenticate } from '../middleware/auth.js'
import { handleAuth } from './auth.js'
import { handleUsers } from './users.js'
import { handleProjects } from './projects.js'
import { handleCategories } from './categories.js'
import { handleTemplates } from './templates.js'
import { handleTasks } from './tasks.js'
import { handleComments } from './comments.js'
import { handleAttachments } from './attachments.js'
import { handleBrandProfiles } from './brand-profiles.js'
import { handleBrandGuides } from './brand-guides.js'
import { handleStorage } from './storage.js'
import { handleTimeEntries } from './time-entries.js'
import { handleReviews } from './reviews.js'
import { handleGamification } from './gamification.js'
import { handleAnalytics } from './analytics.js'
import { handleSearch } from './search.js'
import { handleAI } from './ai.js'
import { handleGenerate, handleGenerateContent } from './generate.js'
import { handleSupport } from './support.js'
import { handleTools } from './tools.js'

export async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/v1', '')
  const method = request.method

  // Health check (no auth)
  if (path === '/health' && method === 'GET') {
    return jsonResponse({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      },
    })
  }

  // Auth routes (no auth required for login)
  if (path.startsWith('/auth')) {
    return handleAuth(request, env, path, method)
  }

  // Public generated content serving (no auth, accessed by UUID)
  if (path.startsWith('/generate/content/')) {
    return handleGenerateContent(request, env, path)
  }

  // All other routes require authentication
  const auth = await authenticate(request, env)

  if (path.startsWith('/users')) return handleUsers(request, env, auth, path, method)
  if (path.startsWith('/projects')) return handleProjects(request, env, auth, path, method)
  if (path.startsWith('/categories')) return handleCategories(request, env, auth, path, method)
  if (path.startsWith('/templates')) return handleTemplates(request, env, auth, path, method)
  if (path.startsWith('/tasks')) return handleTasks(request, env, auth, path, method)
  if (path.startsWith('/comments')) return handleComments(request, env, auth, path, method)
  if (path.startsWith('/attachments')) return handleAttachments(request, env, auth, path, method)
  if (path.startsWith('/brand-profiles')) return handleBrandProfiles(request, env, auth, path, method)
  if (path.startsWith('/brand-guides')) return handleBrandGuides(request, env, auth, path, method)
  if (path.startsWith('/storage')) return handleStorage(request, env, auth, path, method)
  if (path.startsWith('/time-entries')) return handleTimeEntries(request, env, auth, path, method)
  if (path.startsWith('/reviews')) return handleReviews(request, env, auth, path, method)
  if (path.startsWith('/gamification')) return handleGamification(request, env, auth, path, method)
  if (path.startsWith('/analytics')) return handleAnalytics(request, env, auth, path, method)
  if (path.startsWith('/search')) return handleSearch(request, env, auth, path, method)
  if (path.startsWith('/ai')) return handleAI(request, env, auth, path, method)
  if (path.startsWith('/generate')) return handleGenerate(request, env, auth, path, method)
  if (path.startsWith('/support')) return handleSupport(request, env, auth, path, method)
  if (path.startsWith('/tools')) return handleTools(request, env, auth, path, method)

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
