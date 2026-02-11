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

        // FLUX may return a ReadableStream or a raw response — convert to Uint8Array for R2
        const r2Path = `generations/${id}/output.png`
        let imageData = imageResult
        if (imageResult instanceof ReadableStream) {
          const reader = imageResult.getReader()
          const chunks = []
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
          }
          const totalLen = chunks.reduce((acc, c) => acc + c.length, 0)
          imageData = new Uint8Array(totalLen)
          let offset = 0
          for (const chunk of chunks) { imageData.set(chunk, offset); offset += chunk.length }
        } else if (imageResult instanceof ArrayBuffer) {
          imageData = new Uint8Array(imageResult)
        } else if (typeof imageResult === 'object' && imageResult !== null && !(imageResult instanceof Uint8Array) && !(imageResult instanceof Blob)) {
          // Some models return { image: base64string } or similar
          const b64 = imageResult.image || imageResult.data
          if (typeof b64 === 'string') {
            const binary = atob(b64)
            imageData = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) imageData[i] = binary.charCodeAt(i)
          }
        }
        await env.tacklebox_storage.put(r2Path, imageData, {
          httpMetadata: { contentType: 'image/png' },
        })

        result_path = r2Path
        result_type = 'image/png'
        break
      }

      case 'ad_creative': {
        // Step 1: Generate background image
        const imgPrompt = buildImagePrompt(brandProfile, 'ad_background', subType, userPrompt, options)
        const adImageResult = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt: imgPrompt })

        const imgPath = `generations/${id}/background.png`
        let adImageData = adImageResult
        if (adImageResult instanceof ReadableStream) {
          const reader = adImageResult.getReader()
          const chunks = []
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
          }
          const totalLen = chunks.reduce((acc, c) => acc + c.length, 0)
          adImageData = new Uint8Array(totalLen)
          let offset = 0
          for (const chunk of chunks) { adImageData.set(chunk, offset); offset += chunk.length }
        } else if (adImageResult instanceof ArrayBuffer) {
          adImageData = new Uint8Array(adImageResult)
        } else if (typeof adImageResult === 'object' && adImageResult !== null && !(adImageResult instanceof Uint8Array) && !(adImageResult instanceof Blob)) {
          const b64 = adImageResult.image || adImageResult.data
          if (typeof b64 === 'string') {
            const binary = atob(b64)
            adImageData = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) adImageData[i] = binary.charCodeAt(i)
          }
        }
        await env.tacklebox_storage.put(imgPath, adImageData, {
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
