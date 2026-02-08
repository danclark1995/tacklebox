/**
 * Attachment Routes
 * GET /attachments?task_id= - list attachments for a task
 * POST /attachments - upload file
 * DELETE /attachments/:id - delete attachment
 */

import { jsonResponse } from '../index.js'
import { requireAuth } from '../middleware/auth.js'

export async function handleAttachments(request, env, auth, path, method) {
  // GET /attachments?task_id= - list attachments for a task
  if (path === '/attachments' && method === 'GET') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const url = new URL(request.url)
      const taskId = url.searchParams.get('task_id')

      if (!taskId) {
        return jsonResponse(
          { success: false, error: 'task_id is required' },
          400
        )
      }

      // Verify task exists and user has access
      const task = await env.DB.prepare(
        'SELECT id, client_id, contractor_id FROM tasks WHERE id = ?'
      ).bind(taskId).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      // Check access
      const hasAccess =
        auth.user.role === 'admin' ||
        task.client_id === auth.user.id ||
        task.contractor_id === auth.user.id

      if (!hasAccess) {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      const result = await env.DB.prepare(`
        SELECT a.*,
          u.display_name as uploader_name
        FROM task_attachments a
        LEFT JOIN users u ON a.uploaded_by = u.id
        WHERE a.task_id = ?
        ORDER BY a.created_at ASC
      `).bind(taskId).all()

      return jsonResponse({
        success: true,
        data: result.results || [],
      })
    } catch (err) {
      console.error('List attachments error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to fetch attachments' },
        500
      )
    }
  }

  // POST /attachments - upload file
  if (path === '/attachments' && method === 'POST') {
    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      const formData = await request.formData()
      const file = formData.get('file')
      const taskId = formData.get('task_id')
      const uploadType = formData.get('upload_type') || 'submission'

      if (!file || !taskId) {
        return jsonResponse(
          { success: false, error: 'file and task_id are required' },
          400
        )
      }

      // Validate upload_type
      if (!['submission', 'deliverable'].includes(uploadType)) {
        return jsonResponse(
          { success: false, error: 'Invalid upload_type' },
          400
        )
      }

      // Verify task exists and user has access
      const task = await env.DB.prepare(
        'SELECT id, client_id, contractor_id FROM tasks WHERE id = ?'
      ).bind(taskId).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      // Check permissions
      let hasAccess = false
      if (auth.user.role === 'admin') {
        hasAccess = true
      } else if (auth.user.role === 'client' && task.client_id === auth.user.id) {
        // Clients can only upload submission type
        if (uploadType !== 'submission') {
          return jsonResponse(
            { success: false, error: 'Clients can only upload submission files' },
            403
          )
        }
        hasAccess = true
      } else if (auth.user.role === 'contractor' && task.contractor_id === auth.user.id) {
        hasAccess = true
      }

      if (!hasAccess) {
        return jsonResponse(
          { success: false, error: 'You do not have permission to upload to this task' },
          403
        )
      }

      // Generate R2 key
      const fileId = crypto.randomUUID()
      const fileName = file.name
      const r2Key = `attachments/${taskId}/${fileId}_${fileName}`

      // Upload to R2
      await env.tacklebox_storage.put(r2Key, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
      })

      // Create DB record
      const attachmentId = crypto.randomUUID()
      await env.DB.prepare(`
        INSERT INTO task_attachments (id, task_id, uploaded_by, file_name, file_path, file_type, file_size, upload_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        attachmentId,
        taskId,
        auth.user.id,
        fileName,
        r2Key,
        file.type,
        file.size,
        uploadType
      ).run()

      // Update user's storage_used_bytes
      await env.DB.prepare(`
        UPDATE users
        SET storage_used_bytes = storage_used_bytes + ?
        WHERE id = ?
      `).bind(file.size, auth.user.id).run()

      const newAttachment = await env.DB.prepare(`
        SELECT a.*,
          u.display_name as uploader_name
        FROM task_attachments a
        LEFT JOIN users u ON a.uploaded_by = u.id
        WHERE a.id = ?
      `).bind(attachmentId).first()

      return jsonResponse(
        {
          success: true,
          data: newAttachment,
        },
        201
      )
    } catch (err) {
      console.error('Upload attachment error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to upload attachment' },
        500
      )
    }
  }

  // DELETE /attachments/:id - delete attachment
  const deleteMatch = path.match(/^\/attachments\/([^\/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    const attachmentId = deleteMatch[1]

    const authCheck = requireAuth(auth)
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // Fetch attachment
      const attachment = await env.DB.prepare(
        'SELECT * FROM task_attachments WHERE id = ?'
      ).bind(attachmentId).first()

      if (!attachment) {
        return jsonResponse(
          { success: false, error: 'Attachment not found' },
          404
        )
      }

      // Check permissions: admin or uploader only
      if (auth.user.role !== 'admin' && attachment.uploaded_by !== auth.user.id) {
        return jsonResponse(
          { success: false, error: 'Insufficient permissions' },
          403
        )
      }

      // Delete from R2
      await env.tacklebox_storage.delete(attachment.file_path)

      // Delete from DB
      await env.DB.prepare(
        'DELETE FROM task_attachments WHERE id = ?'
      ).bind(attachmentId).run()

      // Update user's storage_used_bytes
      await env.DB.prepare(`
        UPDATE users
        SET storage_used_bytes = storage_used_bytes - ?
        WHERE id = ?
      `).bind(attachment.file_size, attachment.uploaded_by).run()

      return jsonResponse({
        success: true,
        data: { id: attachmentId },
      })
    } catch (err) {
      console.error('Delete attachment error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to delete attachment' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
