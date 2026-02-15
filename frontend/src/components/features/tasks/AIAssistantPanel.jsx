import { useState } from 'react'
import { Download, Maximize2 } from 'lucide-react'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Dropdown from '@/components/ui/Dropdown'
import EmberLoader from '@/components/ui/EmberLoader'
import PromptTips from '@/components/features/PromptTips'
import { apiEndpoint } from '@/config/env'
import { apiFetch } from '@/services/apiFetch'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
]

const FORMATS = {
  instagram: [
    { value: 'post', label: 'Post (1080x1080)' },
    { value: 'story', label: 'Story (1080x1920)' },
    { value: 'banner', label: 'Banner (1080x566)' },
    { value: 'carousel', label: 'Carousel (1080x1080)' },
  ],
  linkedin: [
    { value: 'post', label: 'Post (1200x627)' },
    { value: 'banner', label: 'Banner (1584x396)' },
    { value: 'story', label: 'Story (1080x1920)' },
  ],
  facebook: [
    { value: 'post', label: 'Post (1200x630)' },
    { value: 'cover', label: 'Cover (820x312)' },
    { value: 'story', label: 'Story (1080x1920)' },
  ],
  twitter: [
    { value: 'post', label: 'Post (1600x900)' },
    { value: 'banner', label: 'Banner (1500x500)' },
    { value: 'story', label: 'Story (1080x1920)' },
  ],
}

const DOC_TYPES = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'brief', label: 'Creative Brief' },
  { value: 'one_pager', label: 'One-Pager' },
  { value: 'letterhead', label: 'Letterhead' },
  { value: 'report_cover', label: 'Report Cover' },
]

const AD_FORMATS = [
  { value: 'social_square', label: 'Social Square (1080x1080)' },
  { value: 'social_story', label: 'Social Story (1080x1920)' },
  { value: 'leaderboard', label: 'Leaderboard (728x90)' },
  { value: 'medium_rectangle', label: 'Medium Rectangle (300x250)' },
  { value: 'wide_skyscraper', label: 'Wide Skyscraper (160x600)' },
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'technical', label: 'Technical' },
]

const CONTENT_TYPES = [
  { value: 'social_image', label: 'Social Media Image' },
  { value: 'document', label: 'Document' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'ad_creative', label: 'Ad Creative' },
]

function detectContentType(categoryName) {
  if (!categoryName) return null
  const lower = categoryName.toLowerCase()
  if (lower.includes('social') || lower.includes('digital')) return 'social_image'
  if (lower.includes('print') || lower.includes('packaging') || lower.includes('copy') || lower.includes('brand')) return 'document'
  if (lower.includes('web') || lower.includes('presentation')) return 'presentation'
  if (lower.includes('ad') || lower.includes('illustration')) return 'ad_creative'
  return null
}

function safeArr(val) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return [] } }
  return []
}

export default function AIAssistantPanel({ task, brandProfile, onAttachmentAdded, complexityLevel }) {
  const { addToast } = useToast()
  const [expanded, setExpanded] = useState(complexityLevel === 0)
  const [contentType, setContentType] = useState(() => detectContentType(task?.category_name) || 'social_image')
  const [generating, setGenerating] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showFullSize, setShowFullSize] = useState(false)

  // Social state
  const [platform, setPlatform] = useState('instagram')
  const [format, setFormat] = useState('post')
  const [prompt, setPrompt] = useState(task?.description?.substring(0, 500) || '')

  // Document state
  const [documentType, setDocumentType] = useState('proposal')
  const [keyPoints, setKeyPoints] = useState('')

  // Presentation state
  const [topic, setTopic] = useState(task?.title || '')
  const [audience, setAudience] = useState('')
  const [numSlides, setNumSlides] = useState(6)
  const [tone, setTone] = useState('professional')

  // Ad state
  const [adFormat, setAdFormat] = useState('social_square')
  const [headline, setHeadline] = useState('')
  const [ctaText, setCtaText] = useState('')

  const activeStatuses = ['in_progress', 'review', 'revision']
  if (!activeStatuses.includes(task?.status)) return null
  if (!brandProfile) return null

  const primaryColours = safeArr(brandProfile.colours_primary)

  async function handleGenerate() {
    if (!brandProfile?.id) return
    setGenerating(true)
    setError('')
    setResult(null)

    try {
      let endpoint, body

      switch (contentType) {
        case 'social_image':
          endpoint = '/generate/social'
          body = { brand_profile_id: brandProfile.id, platform, format, prompt: prompt.trim() }
          break
        case 'document':
          endpoint = '/generate/document'
          body = { brand_profile_id: brandProfile.id, document_type: documentType, prompt: prompt.trim(), key_points: keyPoints.trim() || undefined }
          break
        case 'presentation':
          endpoint = '/generate/presentation'
          body = { brand_profile_id: brandProfile.id, topic: topic.trim(), audience: audience.trim() || undefined, num_slides: numSlides, tone, key_points: keyPoints.trim() || undefined }
          break
        case 'ad_creative':
          endpoint = '/generate/ad'
          body = { brand_profile_id: brandProfile.id, ad_format: adFormat, headline: headline.trim() || undefined, cta_text: ctaText.trim() || undefined, prompt: prompt.trim() || undefined }
          break
      }

      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Generation failed')
      }
    } catch (err) {
      setError('Generation failed: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleAttachToTask() {
    if (!result?.id) return
    setAttaching(true)
    try {
      const data = await apiFetch('/generate/attach-to-task', {
        method: 'POST',
        body: JSON.stringify({ generation_id: result.id, task_id: task.id }),
      })
      if (data.success) {
        if (onAttachmentAdded) onAttachmentAdded(data.data)
        addToast('Generated content attached to task as deliverable', 'success')
      } else {
        addToast(data.error || 'Failed to attach', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setAttaching(false)
    }
  }

  const isAiAssist = complexityLevel === 0

  const panelStyle = {
    marginBottom: spacing[4],
    border: `1px solid ${isAiAssist ? colours.neutral[300] : colours.neutral[200]}`,
    borderRadius: radii.xl,
    backgroundColor: colours.surface,
    overflow: 'hidden',
    boxShadow: isAiAssist ? '0 0 12px rgba(255,255,255,0.08)' : 'none',
  }

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing[3]} ${spacing[4]}`,
    cursor: 'pointer',
    transition: `background-color ${transitions.fast}`,
    backgroundColor: expanded ? colours.neutral[100] : 'transparent',
  }

  const headerLeftStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  }

  const headerTitleStyle = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
  }

  const bodyStyle = {
    padding: spacing[4],
    borderTop: `1px solid ${colours.neutral[200]}`,
  }

  const labelStyle = {
    display: 'block',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[600],
    marginBottom: spacing[1],
  }

  const selectStyle = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: colours.neutral[100],
    border: '1px solid #2a2a2a',
    borderRadius: radii.md,
    color: colours.neutral[900],
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[3],
    outline: 'none',
  }

  const textareaStyle = {
    ...selectStyle,
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
  }

  const inputStyle = { ...selectStyle }

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing[3],
  }

  const brandSummaryStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colours.neutral[50],
    borderRadius: radii.lg,
    marginBottom: spacing[4],
  }

  const colourDotStyle = (hex) => ({
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: hex,
    border: `1px solid ${colours.neutral[300]}`,
    flexShrink: 0,
  })

  const previewStyle = {
    marginTop: spacing[4],
    padding: spacing[4],
    backgroundColor: colours.neutral[50],
    borderRadius: radii.lg,
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const actionRowStyle = {
    display: 'flex',
    gap: spacing[2],
    marginTop: spacing[3],
  }

  const sparkleIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  )

  const chevronIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: `transform ${transitions.fast}` }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )

  const renderBrandSummary = () => (
    <div style={brandSummaryStyle}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
          {brandProfile.client_company || brandProfile.company || 'Brand Profile'}
        </div>
        {brandProfile.voice_tone && (
          <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginTop: spacing[1], lineHeight: 1.4 }}>
            {brandProfile.voice_tone.substring(0, 100)}{brandProfile.voice_tone.length > 100 ? '...' : ''}
          </div>
        )}
      </div>
      {primaryColours.length > 0 && (
        <div style={{ display: 'flex', gap: '4px' }}>
          {primaryColours.slice(0, 5).map((c, i) => (
            <div key={i} style={colourDotStyle(c.hex || c)} title={c.name || c.hex || c} />
          ))}
        </div>
      )}
    </div>
  )

  const renderTypeSelector = () => (
    <div style={{ marginBottom: spacing[3] }}>
      <label style={labelStyle}>Content Type</label>
      <Dropdown
        value={contentType}
        onChange={v => setContentType(v)}
        options={CONTENT_TYPES}
        style={{ marginBottom: spacing[3] }}
      />
    </div>
  )

  const renderSocialForm = () => (
    <>
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Platform</label>
          <Dropdown
            value={platform}
            onChange={v => { setPlatform(v); setFormat('post') }}
            options={PLATFORMS}
          />
        </div>
        <div>
          <label style={labelStyle}>Format</label>
          <Dropdown
            value={format}
            onChange={v => setFormat(v)}
            options={FORMATS[platform] || []}
          />
        </div>
      </div>
      <div style={{ marginTop: spacing[3] }}>
        <label style={labelStyle}>Prompt<PromptTips contentType="social_image" /></label>
        <Textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..." rows={3} />
      </div>
    </>
  )

  const renderDocumentForm = () => (
    <>
      <div>
        <label style={labelStyle}>Document Type</label>
        <Dropdown
          value={documentType}
          onChange={v => setDocumentType(v)}
          options={DOC_TYPES}
          style={{ marginBottom: spacing[3] }}
        />
      </div>
      <div>
        <label style={labelStyle}>Prompt<PromptTips contentType="document" /></label>
        <Textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the document you need..." rows={3} />
      </div>
      <div>
        <label style={labelStyle}>Key Points (optional)</label>
        <Textarea value={keyPoints} onChange={e => setKeyPoints(e.target.value)}
          placeholder="Key topics to include..." rows={2} />
      </div>
    </>
  )

  const renderPresentationForm = () => (
    <>
      <div>
        <label style={labelStyle}>Topic<PromptTips contentType="presentation" /></label>
        <Textarea value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="Describe the presentation slides and content..." rows={2} />
      </div>
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Audience (optional)</label>
          <Input value={audience} onChange={e => setAudience(e.target.value)}
            placeholder="e.g. Marketing team" />
        </div>
        <div>
          <label style={labelStyle}>Tone</label>
          <Dropdown
            value={tone}
            onChange={v => setTone(v)}
            options={TONES}
          />
        </div>
      </div>
      <div style={{ marginTop: spacing[3] }}>
        <label style={labelStyle}>Slides</label>
        <Dropdown
          value={numSlides}
          onChange={v => setNumSlides(parseInt(v))}
          options={[4, 5, 6, 8, 10, 12].map(n => ({ value: n, label: `${n} slides` }))}
          style={{ marginBottom: spacing[3] }}
        />
      </div>
      <div>
        <label style={labelStyle}>Key Points (optional)</label>
        <Textarea value={keyPoints} onChange={e => setKeyPoints(e.target.value)}
          placeholder="Main points to cover..." rows={2} />
      </div>
    </>
  )

  const renderAdForm = () => (
    <>
      <div>
        <label style={labelStyle}>Ad Format</label>
        <Dropdown
          value={adFormat}
          onChange={v => setAdFormat(v)}
          options={AD_FORMATS}
          style={{ marginBottom: spacing[3] }}
        />
      </div>
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Headline (optional)</label>
          <Input value={headline} onChange={e => setHeadline(e.target.value)}
            placeholder="e.g. Elevate Your Brand" />
        </div>
        <div>
          <label style={labelStyle}>CTA (optional)</label>
          <Input value={ctaText} onChange={e => setCtaText(e.target.value)}
            placeholder="e.g. Learn More" />
        </div>
      </div>
      <div style={{ marginTop: spacing[3] }}>
        <label style={labelStyle}>Image Prompt (optional)<PromptTips contentType="ad_creative" /></label>
        <Textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the ad visual and copy..." rows={3} />
      </div>
    </>
  )

  const renderForm = () => {
    switch (contentType) {
      case 'social_image': return renderSocialForm()
      case 'document': return renderDocumentForm()
      case 'presentation': return renderPresentationForm()
      case 'ad_creative': return renderAdForm()
      default: return null
    }
  }

  const canGenerate = () => {
    switch (contentType) {
      case 'social_image': return prompt.trim().length > 0
      case 'document': return prompt.trim().length > 0
      case 'presentation': return topic.trim().length > 0
      case 'ad_creative': return true
      default: return false
    }
  }

  const renderPreview = () => {
    if (generating) {
      return (
        <div style={previewStyle}>
          <EmberLoader size="lg" text="Generating draft..." />
          <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[400], marginTop: spacing[1] }}>
            This may take 10-60 seconds
          </div>
        </div>
      )
    }

    if (result && result.id) {
      const isImage = result.result_type === 'image/png'
      const contentUrl = apiEndpoint(`/generate/content/${result.id}`)
      const downloadUrl = apiEndpoint(`/generate/content/${result.id}/download`)
      return (
        <div style={previewStyle}>
          {isImage ? (
            <img
              src={contentUrl}
              alt="Generated content"
              style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: radii.lg, objectFit: 'contain' }}
            />
          ) : (
            <iframe
              src={contentUrl}
              style={{ width: '100%', minHeight: '350px', border: 'none', borderRadius: radii.lg }}
              title="Generated content"
            />
          )}
          <div style={actionRowStyle}>
            <Button size="sm" variant="primary" onClick={handleAttachToTask} disabled={attaching}>
              {attaching ? 'Attaching...' : 'Attach to Task'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.open(downloadUrl, '_blank')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Download size={14} />
                Download
              </span>
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowFullSize(true)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Maximize2 size={14} />
                View Full Size
              </span>
            </Button>
            <Button size="sm" variant="secondary" onClick={handleGenerate} disabled={generating}>
              Regenerate
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <>
    {showFullSize && result && (
      <div
        onClick={() => setShowFullSize(false)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: '20px',
        }}
      >
        {result.result_type === 'image/png' ? (
          <img
            src={apiEndpoint(`/generate/content/${result.id}`)}
            alt="Full size"
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <iframe
            src={apiEndpoint(`/generate/content/${result.id}`)}
            style={{ width: '90vw', height: '90vh', border: 'none', borderRadius: '8px', backgroundColor: '#fff' }}
            title="Full size"
            onClick={e => e.stopPropagation()}
          />
        )}
      </div>
    )}
    <div style={panelStyle}>
      <div style={headerStyle} onClick={() => setExpanded(!expanded)}>
        <div style={headerLeftStyle}>
          <span style={{ color: colours.neutral[600] }}>{sparkleIcon}</span>
          <span style={headerTitleStyle}>AI Assistant</span>
          {!expanded && (
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
              Generate branded content for this task
            </span>
          )}
        </div>
        <span style={{ color: colours.neutral[500] }}>{chevronIcon}</span>
      </div>

      {expanded && (
        <div style={bodyStyle}>
          {isAiAssist && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: `${spacing[2]} ${spacing[3]}`,
              marginBottom: spacing[3],
              fontSize: typography.fontSize.sm,
              color: colours.neutral[700],
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: radii.md,
              border: '1px solid #222',
            }}>
              {sparkleIcon}
              AI Assist Task — Generate a draft to get started
            </div>
          )}
          {renderBrandSummary()}
          {renderTypeSelector()}
          {renderForm()}

          {error && (
            <div style={{ color: colours.neutral[700], fontSize: typography.fontSize.sm, marginTop: spacing[2], marginBottom: spacing[2] }}>
              {error}
            </div>
          )}

          {!result && (
            <Button
              onClick={handleGenerate}
              disabled={generating || !canGenerate()}
              style={{ width: '100%', marginTop: spacing[3] }}
            >
              {generating ? 'Generating...' : 'Generate Draft'}
            </Button>
          )}

          {renderPreview()}
        </div>
      )}
    </div>
    </>
  )
}
