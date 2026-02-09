/**
 * AI Routes — Workers AI integration for brief analysis
 * POST /ai/analyse-brief/:taskId - AI-powered task brief analysis
 */

import { jsonResponse } from '../index.js'
import { requireRole } from '../middleware/auth.js'

export async function handleAI(request, env, auth, path, method) {
  // POST /ai/analyse-brief/:taskId - AI brief analysis
  const analyseBriefMatch = path.match(/^\/ai\/analyse-brief\/([^\/]+)$/)
  if (analyseBriefMatch && method === 'POST') {
    const taskId = analyseBriefMatch[1]

    const authCheck = requireRole(auth, 'admin')
    if (!authCheck.authorized) {
      return jsonResponse(
        { success: false, error: authCheck.error },
        authCheck.status
      )
    }

    try {
      // Fetch the task with category name
      const task = await env.DB.prepare(`
        SELECT t.id, t.title, t.description,
          cat.name as category_name
        FROM tasks t
        LEFT JOIN task_categories cat ON t.category_id = cat.id
        WHERE t.id = ?
      `).bind(taskId).first()

      if (!task) {
        return jsonResponse(
          { success: false, error: 'Task not found' },
          404
        )
      }

      if (!task.description) {
        return jsonResponse(
          { success: false, error: 'Task has no description to analyse' },
          400
        )
      }

      // Fetch all categories for suggestion
      const categoriesResult = await env.DB.prepare(
        'SELECT name FROM task_categories ORDER BY name ASC'
      ).all()
      const categoryNames = (categoriesResult.results || []).map(c => c.name)

      // Build AI prompt
      const prompt = `Analyse this design task brief and provide:
1) A concise summary (2-3 sentences)
2) Key deliverables identified
3) Suggested category from these options: [${categoryNames.join(', ')}]
4) Estimated complexity (low/medium/high)
5) Any questions or clarifications needed

Task: ${task.title}
Brief: ${task.description}`

      // Call Workers AI
      const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are a project management assistant that analyses design task briefs. Provide structured, actionable analysis. Be concise and practical.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const analysis = aiResponse.response || aiResponse

      // Store result in task's ai_metadata field
      const aiMetadata = JSON.stringify({
        analysis,
        analysed_at: new Date().toISOString(),
        model: '@cf/meta/llama-3.1-8b-instruct',
      })

      await env.DB.prepare(
        'UPDATE tasks SET ai_metadata = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(aiMetadata, taskId).run()

      return jsonResponse({
        success: true,
        data: {
          task_id: taskId,
          analysis,
          analysed_at: new Date().toISOString(),
          model: '@cf/meta/llama-3.1-8b-instruct',
        },
      })
    } catch (err) {
      console.error('AI analysis error:', err)
      return jsonResponse(
        { success: false, error: 'Failed to analyse brief' },
        500
      )
    }
  }

  return jsonResponse({ success: false, error: 'Route not found' }, 404)
}
