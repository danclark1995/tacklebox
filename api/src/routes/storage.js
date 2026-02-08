/**
 * Storage Routes — R2 file serving
 * Download and preview files stored in R2.
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'

export async function handleStorage(request, env, auth, path, method) {
  const check = requireAuth(auth)
  if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

  // GET /storage/download/... — download file
  if (path.startsWith('/storage/download/') && method === 'GET') {
    const key = decodeURIComponent(path.replace('/storage/download/', ''))
    try {
      const object = await env.tacklebox_storage.get(key)
      if (!object) {
        return jsonResponse({ success: false, error: 'File not found' }, 404)
      }

      const filename = key.split('/').pop().replace(/^[a-f0-9-]+_/, '')
      const headers = new Headers()
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
      headers.set('Content-Disposition', `attachment; filename="${filename}"`)
      if (object.size) headers.set('Content-Length', object.size)

      return new Response(object.body, { headers })
    } catch (err) {
      console.error('Download error:', err)
      return jsonResponse({ success: false, error: 'Failed to download file' }, 500)
    }
  }

  // GET /storage/preview/... — inline preview (images/PDFs)
  if (path.startsWith('/storage/preview/') && method === 'GET') {
    const key = decodeURIComponent(path.replace('/storage/preview/', ''))
    try {
      const object = await env.tacklebox_storage.get(key)
      if (!object) {
        return jsonResponse({ success: false, error: 'File not found' }, 404)
      }

      const headers = new Headers()
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
      headers.set('Content-Disposition', 'inline')
      if (object.size) headers.set('Content-Length', object.size)
      headers.set('Cache-Control', 'public, max-age=3600')

      return new Response(object.body, { headers })
    } catch (err) {
      console.error('Preview error:', err)
      return jsonResponse({ success: false, error: 'Failed to preview file' }, 500)
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
