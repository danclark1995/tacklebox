/**
 * Storage Routes — R2 file serving
 * Download and preview files stored in R2.
 * Per-file authorization: verifies user has access to the resource.
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'

async function canAccessFile(key, user, env) {
  // Admins can access everything
  if (user.role === 'admin') return true

  // Attachment files: attachments/{taskId}/...
  if (key.startsWith('attachments/')) {
    const taskId = key.split('/')[1]
    if (!taskId) return false
    const task = await env.DB.prepare(
      'SELECT client_id, contractor_id FROM tasks WHERE id = ?'
    ).bind(taskId).first()
    if (!task) return false
    return user.id === task.client_id || user.id === task.contractor_id
  }

  // Brand guide files: brand-guides/{clientId}/...
  if (key.startsWith('brand-guides/')) {
    const clientId = key.split('/')[1]
    if (!clientId) return false
    // Client can access their own guides
    if (user.role === 'client') return user.id === clientId
    // Contractor can access guides for clients whose tasks they're assigned to
    if (user.role === 'contractor') {
      const link = await env.DB.prepare(
        'SELECT 1 FROM tasks WHERE contractor_id = ? AND client_id = ? LIMIT 1'
      ).bind(user.id, clientId).first()
      return !!link
    }
  }

  // Default deny for unknown paths
  return false
}

export async function handleStorage(request, env, auth, path, method) {
  const check = requireAuth(auth)
  if (!check.authorized) return jsonResponse({ success: false, error: check.error }, check.status)

  // GET /storage/download/... — download file
  if (path.startsWith('/storage/download/') && method === 'GET') {
    const key = decodeURIComponent(path.replace('/storage/download/', ''))

    const allowed = await canAccessFile(key, auth.user, env)
    if (!allowed) return jsonResponse({ success: false, error: 'Access denied' }, 403)

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

    const allowed = await canAccessFile(key, auth.user, env)
    if (!allowed) return jsonResponse({ success: false, error: 'Access denied' }, 403)

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
