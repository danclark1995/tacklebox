/**
 * Prompt Builder — constructs AI prompts from brand profile data
 */

function safeArr(val) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return [] } }
  return []
}

function safeObj(val) {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val
  if (typeof val === 'string') { try { return JSON.parse(val) } catch { return {} } }
  return {}
}

const PLATFORM_GUIDANCE = {
  instagram_post: 'Square 1:1 composition, bold and eye-catching, optimized for mobile viewing',
  instagram_story: 'Vertical 9:16, immersive full-screen, bold text placement in center-third',
  linkedin_post: 'Landscape 1.91:1, professional and polished, clean with breathing room',
  linkedin_banner: 'Ultra-wide panoramic, minimal text, brand showcase',
  facebook_post: 'Landscape 1.91:1, vibrant and engaging, social-first design',
  facebook_cover: 'Wide banner, brand-forward, important elements in center',
  twitter_post: 'Landscape 16:9, punchy and immediate, high contrast',
}

export function buildImagePrompt(brandProfile, contentType, subType, userInput, options = {}) {
  const archetypes = safeArr(brandProfile.archetypes)
  const imagery = safeObj(brandProfile.imagery_guidelines)
  const primaryColours = safeArr(brandProfile.colours_primary)
  const secondaryColours = safeArr(brandProfile.colours_secondary)
  const metaphors = safeArr(brandProfile.metaphors)

  const parts = []

  // Core user request
  parts.push(userInput || 'Professional branded visual content')

  // Brand personality from archetypes
  if (archetypes.length > 0) {
    const personalities = archetypes.map(a => a.name).join(', ')
    parts.push(`Brand personality: ${personalities}`)
  }

  // Visual style from imagery guidelines
  if (imagery.backgrounds?.length > 0) {
    parts.push(`Visual style: ${imagery.backgrounds[0]}`)
  }
  if (imagery.notes) {
    parts.push(imagery.notes)
  }

  // Colour palette
  const allColours = [...primaryColours, ...secondaryColours]
  if (allColours.length > 0) {
    const hexValues = allColours.filter(c => c.hex).map(c => c.hex).slice(0, 5)
    parts.push(`Colour palette: ${hexValues.join(', ')}`)
  }

  // Mood from metaphors
  if (metaphors.length > 0) {
    parts.push(`Mood: ${metaphors[0].name} — ${metaphors[0].description?.substring(0, 80)}`)
  }

  // Platform-specific guidance
  const platformKey = `${options.platform}_${options.format}`
  if (PLATFORM_GUIDANCE[platformKey]) {
    parts.push(PLATFORM_GUIDANCE[platformKey])
  }

  // Industry context
  if (brandProfile.industry) {
    parts.push(`Industry: ${brandProfile.industry}`)
  }

  parts.push('High quality, professional, photorealistic')

  return parts.join('. ').substring(0, 2000)
}

export function buildTextPrompt(brandProfile, contentType, subType, userInput, options = {}) {
  const values = safeArr(brandProfile.brand_values)
  const archetypes = safeArr(brandProfile.archetypes)
  const pillars = safeArr(brandProfile.messaging_pillars)

  const brandContext = []

  if (brandProfile.client_company || brandProfile.company) {
    brandContext.push(`Company: ${brandProfile.client_company || brandProfile.company}`)
  }
  if (brandProfile.industry) brandContext.push(`Industry: ${brandProfile.industry}`)
  if (brandProfile.tagline) brandContext.push(`Tagline: "${brandProfile.tagline}"`)
  if (brandProfile.voice_tone) brandContext.push(`Voice & Tone: ${brandProfile.voice_tone}`)
  if (brandProfile.brand_narrative) brandContext.push(`Brand Story: ${brandProfile.brand_narrative.substring(0, 300)}`)
  if (brandProfile.target_audience) brandContext.push(`Target Audience: ${brandProfile.target_audience}`)

  if (values.length > 0) {
    brandContext.push(`Brand Values: ${values.map(v => `${v.name} (${v.tagline || ''})`).join(', ')}`)
  }
  if (archetypes.length > 0) {
    brandContext.push(`Brand Archetypes: ${archetypes.map(a => `${a.name}: ${a.description?.substring(0, 60)}`).join('; ')}`)
  }
  if (pillars.length > 0) {
    const phrases = pillars.flatMap(p => p.phrases || []).slice(0, 10)
    brandContext.push(`Key Messaging: ${phrases.join(' | ')}`)
  }

  const systemPrompt = `You are a creative content writer for ${brandProfile.client_company || 'the brand'}.
Write all content in the brand's voice and style. Never break character.

${brandContext.join('\n')}

Always maintain brand consistency. Use the messaging pillars and brand values naturally.`

  const userPrompt = buildUserPromptForType(contentType, subType, userInput, options)

  return { systemPrompt, userPrompt }
}

function buildUserPromptForType(contentType, subType, userInput, options) {
  switch (contentType) {
    case 'document':
      return `Create a ${subType || 'document'} about: ${userInput}${options.key_points ? `\n\nKey points to cover:\n${options.key_points}` : ''}${options.recipient ? `\nAddressed to: ${options.recipient}` : ''}\n\nWrite the complete content. Use professional formatting.`

    case 'presentation':
      return `Create a presentation about: ${userInput}\nNumber of slides: ${options.num_slides || 6}\nAudience: ${options.audience || 'general'}\nTone: ${options.tone || 'professional'}${options.key_points ? `\nKey points:\n${options.key_points}` : ''}\n\nReturn a JSON array of slides: [{"title": "...", "bullets": ["..."], "notes": "..."}]\nReturn ONLY the JSON array, no other text.`

    case 'ad':
      return `Write ad copy for:\nHeadline: ${options.headline || ''}\nCTA: ${options.cta_text || ''}\nOffer: ${userInput}\n\nReturn JSON: {"headline": "...", "subheadline": "...", "cta": "...", "body": "..."}\nReturn ONLY the JSON, no other text.`

    default:
      return userInput
  }
}
