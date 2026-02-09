/**
 * Content Generator — orchestrates AI generation and storage
 */

import { buildImagePrompt, buildTextPrompt } from './prompt-builder.js'
import { renderDocument, renderPresentation, renderAdOverlay } from './template-engine.js'

export async function generateContent(env, brandProfile, contentType, subType, userPrompt, options = {}) {
  const id = crypto.randomUUID()

  try {
    let result_path = null
    let result_type = null
    let metadata = {}

    switch (contentType) {
      case 'social_image':
      case 'ad_background': {
        const prompt = buildImagePrompt(brandProfile, contentType, subType, userPrompt, options)
        metadata.prompt_used = prompt
        metadata.dimensions = options.dimensions

        const imageResult = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt })

        // FLUX returns a ReadableStream of the image
        const r2Path = `generations/${id}/output.png`
        await env.tacklebox_storage.put(r2Path, imageResult, {
          httpMetadata: { contentType: 'image/png' },
        })

        result_path = r2Path
        result_type = 'image/png'
        break
      }

      case 'ad_creative': {
        // Step 1: Generate background image
        const imgPrompt = buildImagePrompt(brandProfile, 'ad_background', subType, userPrompt, options)
        const imageResult = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt: imgPrompt })

        const imgPath = `generations/${id}/background.png`
        await env.tacklebox_storage.put(imgPath, imageResult, {
          httpMetadata: { contentType: 'image/png' },
        })

        // Step 2: Generate ad copy if needed
        let adData = { headline: options.headline || '', cta: options.cta_text || '', subheadline: '', body: options.offer || '' }
        if (!options.headline) {
          const { systemPrompt, userPrompt: up } = buildTextPrompt(brandProfile, 'ad', subType, userPrompt, options)
          const textResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: up }],
            max_tokens: 500,
          })
          try { adData = { ...adData, ...JSON.parse(textResult.response.match(/\{[\s\S]*\}/)?.[0] || '{}') } } catch { /* use defaults */ }
        }

        // Step 3: Render overlay HTML
        const storageUrl = `/api/v1/storage/${imgPath}`
        const html = renderAdOverlay(brandProfile, storageUrl, { ...adData, ...options })

        const htmlPath = `generations/${id}/output.html`
        await env.tacklebox_storage.put(htmlPath, html, {
          httpMetadata: { contentType: 'text/html' },
        })

        result_path = htmlPath
        result_type = 'text/html'
        metadata.background_path = imgPath
        metadata.ad_data = adData
        metadata.dimensions = options.dimensions
        break
      }

      case 'document': {
        const { systemPrompt, userPrompt: up } = buildTextPrompt(brandProfile, 'document', subType, userPrompt, options)
        const textResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: up }],
          max_tokens: 3000,
        })

        const contentData = { body: textResult.response || '', title: userPrompt.substring(0, 100), ...options }
        const html = renderDocument(brandProfile, contentData, subType)

        const htmlPath = `generations/${id}/output.html`
        await env.tacklebox_storage.put(htmlPath, html, {
          httpMetadata: { contentType: 'text/html' },
        })

        result_path = htmlPath
        result_type = 'text/html'
        break
      }

      case 'presentation': {
        const { systemPrompt, userPrompt: up } = buildTextPrompt(brandProfile, 'presentation', subType, userPrompt, options)
        const textResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: up }],
          max_tokens: 3000,
        })

        let slides = []
        try {
          const raw = textResult.response || ''
          const jsonMatch = raw.match(/\[[\s\S]*\]/)
          if (jsonMatch) slides = JSON.parse(jsonMatch[0])
        } catch { /* fallback */ }

        if (slides.length === 0) {
          slides = [{ title: userPrompt.substring(0, 100), bullets: ['Content generation in progress...'], notes: '' }]
        }

        const html = renderPresentation(brandProfile, slides, subType)

        const htmlPath = `generations/${id}/output.html`
        await env.tacklebox_storage.put(htmlPath, html, {
          httpMetadata: { contentType: 'text/html' },
        })

        result_path = htmlPath
        result_type = 'text/html'
        metadata.slide_count = slides.length
        break
      }
    }

    // Save generation record
    await env.DB.prepare(`
      INSERT INTO generations (id, user_id, client_id, brand_profile_id, content_type, sub_type, user_prompt, result_path, result_type, metadata, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `).bind(
      id,
      options.user_id || null,
      options.client_id || brandProfile.client_id,
      brandProfile.id,
      contentType,
      subType || null,
      userPrompt,
      result_path,
      result_type,
      JSON.stringify(metadata),
      ).run()

    return { id, status: 'completed', result_path, content_type: contentType, result_type, metadata }
  } catch (err) {
    // Save failed record
    try {
      await env.DB.prepare(`
        INSERT INTO generations (id, user_id, client_id, brand_profile_id, content_type, sub_type, user_prompt, metadata, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'failed')
      `).bind(id, options.user_id || null, options.client_id || brandProfile.client_id, brandProfile.id, contentType, subType || null, userPrompt, JSON.stringify({ error: err.message })).run()
    } catch { /* ignore */ }

    throw err
  }
}
