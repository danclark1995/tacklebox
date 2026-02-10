import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import { colours, spacing, typography, radii, shadows, transitions } from '@/config/tokens'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
]

const FORMATS = {
  instagram: [
    { value: 'post', label: 'Post (1080×1080)' },
    { value: 'story', label: 'Story (1080×1920)' },
    { value: 'banner', label: 'Banner (1080×566)' },
    { value: 'carousel', label: 'Carousel (1080×1080)' },
  ],
  linkedin: [
    { value: 'post', label: 'Post (1200×627)' },
    { value: 'banner', label: 'Banner (1584×396)' },
    { value: 'story', label: 'Story (1080×1920)' },
  ],
  facebook: [
    { value: 'post', label: 'Post (1200×630)' },
    { value: 'cover', label: 'Cover (820×312)' },
    { value: 'story', label: 'Story (1080×1920)' },
  ],
  twitter: [
    { value: 'post', label: 'Post (1600×900)' },
    { value: 'banner', label: 'Banner (1500×500)' },
    { value: 'story', label: 'Story (1080×1920)' },
  ],
}

export default function CreateSocial() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [brandProfiles, setBrandProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [format, setFormat] = useState('post')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBrandProfiles()
  }, [])

  async function fetchBrandProfiles() {
    try {
      const res = await fetch(apiEndpoint('/brand-profiles'), { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success && data.data?.length > 0) {
        setBrandProfiles(data.data)
        setSelectedProfile(data.data[0].id)
      }
    } catch {}
  }

  async function handleGenerate() {
    if (!selectedProfile || !prompt.trim()) return
    setGenerating(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(apiEndpoint('/generate/social'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_profile_id: selectedProfile,
          platform,
          format,
          prompt: prompt.trim(),
        }),
      })
      const data = await res.json()
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
    cursor: 'pointer', marginBottom: spacing[4], textDecoration: 'none',
    transition: `color ${transitions.fast}`,
  }

  const titleStyle = {
    fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900], marginBottom: spacing[6],
  }

  const twoColStyle = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[6],
  }

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

  const textareaStyle = {
    ...selectStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit',
    marginBottom: spacing[4],
  }

  const previewStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '300px', color: colours.neutral[500], fontSize: typography.fontSize.sm,
  }

  const resultImageStyle = {
    maxWidth: '100%', maxHeight: '500px', borderRadius: radii.lg, objectFit: 'contain',
  }

  return (
    <div style={containerStyle}>
      <div style={backStyle} onClick={() => navigate('/admin/tools')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Create
      </div>

      <h1 style={titleStyle}>Social Media Image</h1>

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

          <label style={labelStyle}>Platform</label>
          <Dropdown
            value={platform}
            onChange={v => { setPlatform(v); setFormat('post') }}
            options={PLATFORMS}
            style={{ marginBottom: spacing[4] }}
          />

          <label style={labelStyle}>Format</label>
          <Dropdown
            value={format}
            onChange={v => setFormat(v)}
            options={FORMATS[platform] || []}
            style={{ marginBottom: spacing[4] }}
          />

          <label style={labelStyle}>Prompt</label>
          <textarea
            style={textareaStyle}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what you want in the image... e.g. 'Minimalist product showcase with dark background'"
          />

          {error && (
            <div style={{ color: colours.neutral[700], fontSize: typography.fontSize.sm, marginBottom: spacing[3] }}>
              {error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating || !prompt.trim() || !selectedProfile} style={{ width: '100%' }}>
            {generating ? 'Generating...' : 'Generate Image'}
          </Button>
        </div>

        <div style={panelStyle}>
          <label style={{ ...labelStyle, marginBottom: spacing[4] }}>Preview</label>
          <div style={previewStyle}>
            {generating && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: spacing[3], fontSize: typography.fontSize.lg }}>Generating...</div>
                <div style={{ color: colours.neutral[400] }}>This may take 10-30 seconds</div>
              </div>
            )}
            {result && result.result_path && (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={apiEndpoint(`/storage/${result.result_path}`)}
                  alt="Generated social media image"
                  style={resultImageStyle}
                />
                <div style={{ marginTop: spacing[3], fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                  {platform} {format} — {result.id?.substring(0, 8)}
                </div>
              </div>
            )}
            {!generating && !result && (
              <div style={{ textAlign: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colours.neutral[300]} strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <div style={{ marginTop: spacing[3] }}>Your generated image will appear here</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
