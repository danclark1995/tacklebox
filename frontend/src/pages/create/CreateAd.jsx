import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { apiEndpoint } from '@/config/env'
import { apiFetch } from '@/services/apiFetch'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Dropdown from '@/components/ui/Dropdown'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const AD_FORMATS = [
  { value: 'social_square', label: 'Social Square (1080×1080)' },
  { value: 'social_story', label: 'Social Story (1080×1920)' },
  { value: 'leaderboard', label: 'Leaderboard (728×90)' },
  { value: 'medium_rectangle', label: 'Medium Rectangle (300×250)' },
  { value: 'wide_skyscraper', label: 'Wide Skyscraper (160×600)' },
]

export default function CreateAd() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [brandProfiles, setBrandProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [adFormat, setAdFormat] = useState('social_square')
  const [headline, setHeadline] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [offer, setOffer] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBrandProfiles()
  }, [])

  async function fetchBrandProfiles() {
    try {
      const data = await apiFetch('/brand-profiles')
      if (data.success && data.data?.length > 0) {
        setBrandProfiles(data.data)
        setSelectedProfile(data.data[0].id)
      }
    } catch {}
  }

  async function handleGenerate() {
    if (!selectedProfile || !adFormat) return
    setGenerating(true)
    setError('')
    setResult(null)

    try {
      const data = await apiFetch('/generate/ad', {
        method: 'POST',
        body: JSON.stringify({
          brand_profile_id: selectedProfile,
          ad_format: adFormat,
          headline: headline.trim() || undefined,
          cta_text: ctaText.trim() || undefined,
          offer: offer.trim() || undefined,
          prompt: prompt.trim() || undefined,
        }),
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

  const containerStyle = { padding: spacing[6], maxWidth: '1000px', margin: '0 auto' }

  const backStyle = {
    display: 'inline-flex', alignItems: 'center', gap: spacing[1],
    color: colours.neutral[500], fontSize: typography.fontSize.sm,
    cursor: 'pointer', marginBottom: spacing[4],
  }

  const titleStyle = {
    fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900], marginBottom: spacing[6],
  }

  const twoColStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[6] }

  const panelStyle = {
    backgroundColor: colours.surface, border: `1px solid ${colours.neutral[200]}`,
    borderRadius: radii.xl, padding: spacing[6],
  }

  const labelStyle = {
    display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium,
    color: colours.neutral[700], marginBottom: spacing[2],
  }

  const selectStyle = {
    width: '100%', padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colours.neutral[100], border: `1px solid ${colours.neutral[200]}`,
    borderRadius: radii.md, color: colours.neutral[900], fontSize: typography.fontSize.sm,
    marginBottom: spacing[4], outline: 'none',
  }

  const inputStyle = { ...selectStyle }

  const textareaStyle = {
    ...selectStyle, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit',
  }

  const previewStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '400px',
  }

  return (
    <div style={containerStyle}>
      <div style={backStyle} onClick={() => navigate('/admin/tools')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Create
      </div>

      <h1 style={titleStyle}>Ad Creative</h1>

      <div style={twoColStyle}>
        <div style={panelStyle}>
          <label style={labelStyle}>Brand Profile</label>
          <Dropdown
            value={selectedProfile}
            onChange={v => setSelectedProfile(v)}
            options={brandProfiles.map(bp => ({ value: bp.id, label: bp.company || bp.client_name || 'Brand Profile' }))}
            placeholder="Select brand profile"
            style={{ marginBottom: spacing[4] }}
          />

          <label style={labelStyle}>Ad Format</label>
          <Dropdown
            value={adFormat}
            onChange={v => setAdFormat(v)}
            options={AD_FORMATS}
            style={{ marginBottom: spacing[4] }}
          />

          <div style={{ marginBottom: spacing[4] }}>
            <Input
              label="Headline (optional — AI will generate if blank)"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. 'Elevate Your Brand'"
            />
          </div>

          <div style={{ marginBottom: spacing[4] }}>
            <Input
              label="CTA Text (optional)"
              value={ctaText}
              onChange={e => setCtaText(e.target.value)}
              placeholder="e.g. 'Learn More', 'Get Started'"
            />
          </div>

          <div style={{ marginBottom: spacing[4] }}>
            <Input
              label="Offer / Description (optional)"
              value={offer}
              onChange={e => setOffer(e.target.value)}
              placeholder="e.g. '50% off first month'"
            />
          </div>

          <div style={{ marginBottom: spacing[4] }}>
            <Textarea
              label="Image Prompt (optional)"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the background image... e.g. 'Abstract dark gradient with subtle gold accents'"
              rows={3}
            />
          </div>

          {error && (
            <div style={{ color: colours.neutral[700], fontSize: typography.fontSize.sm, marginBottom: spacing[3] }}>
              {error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating || !selectedProfile} style={{ width: '100%' }}>
            {generating ? 'Generating...' : 'Generate Ad Creative'}
          </Button>
        </div>

        <div style={panelStyle}>
          <label style={{ ...labelStyle, marginBottom: spacing[4] }}>Preview</label>
          <div style={previewStyle}>
            {generating && (
              <div style={{ textAlign: 'center', color: colours.neutral[500] }}>
                <div style={{ marginBottom: spacing[3], fontSize: typography.fontSize.lg }}>Generating...</div>
                <div style={{ color: colours.neutral[400] }}>This may take 20-60 seconds (image + copy + overlay)</div>
              </div>
            )}
            {result && result.result_path && (
              <div style={{ width: '100%', height: '100%' }}>
                <iframe
                  src={apiEndpoint(`/storage/${result.result_path}`)}
                  style={{
                    width: '100%', minHeight: '500px', border: 'none',
                    borderRadius: radii.lg,
                  }}
                  title="Generated ad creative"
                />
                <div style={{ marginTop: spacing[3], fontSize: typography.fontSize.xs, color: colours.neutral[500], textAlign: 'center' }}>
                  {adFormat} — {result.id?.substring(0, 8)}
                </div>
              </div>
            )}
            {!generating && !result && (
              <div style={{ textAlign: 'center', color: colours.neutral[500], fontSize: typography.fontSize.sm }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colours.neutral[300]} strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <div style={{ marginTop: spacing[3] }}>Your generated ad will appear here</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
