/**
 * TackleBox API — Cloudflare Worker Entry Point
 *
 * All API routes are under /api/v1/
 * Consistent response format: { success, data/error }
 */

import { handleApiRequest } from './routes/index.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ENVIRONMENT === 'production'
        ? 'https://app.tacklebox.app'
        : 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
      // API routes
      if (url.pathname.startsWith('/api/v1/')) {
        const response = await handleApiRequest(request, env, ctx)
        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
        return response
      }

      return jsonResponse({ success: false, error: 'Not found' }, 404, corsHeaders)
    } catch (err) {
      console.error('Unhandled error:', err)
      return jsonResponse(
        { success: false, error: 'Internal server error' },
        500,
        corsHeaders
      )
    }
  },
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  })
}
