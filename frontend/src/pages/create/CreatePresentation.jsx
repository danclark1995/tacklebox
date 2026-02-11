import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'technical', label: 'Technical' },
  { value: 'storytelling', label: 'Storytelling' },
]

export default function CreatePresentation() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [brandProfiles, setBrandProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')
  const [numSlides, setNumSlides] = useState(6)
  const [keyPoints, setKeyPoints] = useState('')
  const [tone, setTone] = useState('professional')
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
    if (!selectedProfile || !topic.trim()) return
    setGenerating(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(apiEndpoint('/generate/presentation'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_profile_id: selectedProfile,
          topic: topic.trim(),
          audience: audience.trim() || undefined,
          num_slides: numSlides,
          key_points: keyPoints.trim() || undefined,
          tone,
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
    backgroundColor: '#111111', border: '1px solid #2a2a2a',
    borderRadius: radii.md, color: colours.neutral[900], fontSize: typography.fontSize.sm,
    marginBottom: spacing[4], outline: 'none',
  }

  const inputStyle = { ...selectStyle }

  const textareaStyle = {
    ...selectStyle, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit',
  }

  const rowStyle = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3], marginBottom: spacing[4],
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

      <h1 style={titleStyle}>Branded Presentation</h1>

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

          <label style={labelStyle}>Topic</label>
          <textarea
            style={textareaStyle}
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="What is the presentation about? e.g. 'Q1 2026 Brand Strategy Overview'"
          />

          <label style={labelStyle}>Target Audience (optional)</label>
          <input
            style={inputStyle}
            value={audience}
            onChange={e => setAudience(e.target.value)}
            placeholder="e.g. Marketing team, Board of Directors..."
          />

          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Slides</label>
              <Dropdown
                value={numSlides}
                onChange={v => setNumSlides(parseInt(v))}
                options={[4, 5, 6, 8, 10, 12].map(n => ({ value: n, label: `${n} slides` }))}
              />
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

          <label style={labelStyle}>Key Points (optional)</label>
          <textarea
            style={{ ...textareaStyle, minHeight: '80px' }}
            value={keyPoints}
            onChange={e => setKeyPoints(e.target.value)}
            placeholder="Main points to cover in the presentation..."
          />

          {error && (
            <div style={{ color: colours.neutral[700], fontSize: typography.fontSize.sm, marginBottom: spacing[3] }}>
              {error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating || !topic.trim() || !selectedProfile} style={{ width: '100%' }}>
            {generating ? 'Generating...' : 'Generate Presentation'}
          </Button>
        </div>

        <div style={panelStyle}>
          <label style={{ ...labelStyle, marginBottom: spacing[4] }}>Preview</label>
          <div style={previewStyle}>
            {generating && (
              <div style={{ textAlign: 'center', color: colours.neutral[500] }}>
                <div style={{ marginBottom: spacing[3], fontSize: typography.fontSize.lg }}>Generating...</div>
                <div style={{ color: colours.neutral[400] }}>This may take 15-45 seconds</div>
              </div>
            )}
            {result && result.result_path && (
              <div style={{ width: '100%', height: '100%' }}>
                <iframe
                  src={apiEndpoint(`/storage/${result.result_path}`)}
                  style={{
                    width: '100%', minHeight: '500px', border: 'none',
                    borderRadius: radii.lg, backgroundColor: '#0a0a0a',
                  }}
                  title="Generated presentation"
                />
                <div style={{ marginTop: spacing[3], display: 'flex', justifyContent: 'space-between', fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                  <span>{result.metadata?.slide_count || numSlides} slides</span>
                  <span>{result.id?.substring(0, 8)}</span>
                </div>
              </div>
            )}
            {!generating && !result && (
              <div style={{ textAlign: 'center', color: colours.neutral[500], fontSize: typography.fontSize.sm }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colours.neutral[300]} strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <div style={{ marginTop: spacing[3] }}>Your generated presentation will appear here</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
