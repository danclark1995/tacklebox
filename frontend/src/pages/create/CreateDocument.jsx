import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const DOC_TYPES = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'brief', label: 'Creative Brief' },
  { value: 'one_pager', label: 'One-Pager' },
  { value: 'letterhead', label: 'Letterhead' },
  { value: 'report_cover', label: 'Report Cover' },
]

export default function CreateDocument() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [brandProfiles, setBrandProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [documentType, setDocumentType] = useState('proposal')
  const [prompt, setPrompt] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  const [recipient, setRecipient] = useState('')
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
      const res = await fetch(apiEndpoint('/generate/document'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_profile_id: selectedProfile,
          document_type: documentType,
          prompt: prompt.trim(),
          key_points: keyPoints.trim() || undefined,
          recipient: recipient.trim() || undefined,
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
    backgroundColor: colours.neutral[100], border: `1px solid ${colours.neutral[200]}`,
    borderRadius: radii.md, color: colours.neutral[900], fontSize: typography.fontSize.sm,
    marginBottom: spacing[4], outline: 'none',
  }

  const inputStyle = { ...selectStyle }

  const textareaStyle = {
    ...selectStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit',
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

      <h1 style={titleStyle}>Branded Document</h1>

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

          <label style={labelStyle}>Document Type</label>
          <Dropdown
            value={documentType}
            onChange={v => setDocumentType(v)}
            options={DOC_TYPES}
            style={{ marginBottom: spacing[4] }}
          />

          <label style={labelStyle}>Prompt</label>
          <textarea
            style={textareaStyle}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the document content... e.g. 'Quarterly brand strategy report for Q1 2026'"
          />

          <label style={labelStyle}>Key Points (optional)</label>
          <textarea
            style={{ ...textareaStyle, minHeight: '80px' }}
            value={keyPoints}
            onChange={e => setKeyPoints(e.target.value)}
            placeholder="Bullet points or key topics to include..."
          />

          {documentType === 'letterhead' && (
            <>
              <label style={labelStyle}>Recipient (optional)</label>
              <input
                style={inputStyle}
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="To: recipient name or company"
              />
            </>
          )}

          {error && (
            <div style={{ color: colours.neutral[700], fontSize: typography.fontSize.sm, marginBottom: spacing[3] }}>
              {error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating || !prompt.trim() || !selectedProfile} style={{ width: '100%' }}>
            {generating ? 'Generating...' : 'Generate Document'}
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
                    borderRadius: radii.lg, backgroundColor: '#fff',
                  }}
                  title="Generated document"
                />
                <div style={{ marginTop: spacing[3], fontSize: typography.fontSize.xs, color: colours.neutral[500], textAlign: 'center' }}>
                  {documentType} — {result.id?.substring(0, 8)}
                </div>
              </div>
            )}
            {!generating && !result && (
              <div style={{ textAlign: 'center', color: colours.neutral[500], fontSize: typography.fontSize.sm }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colours.neutral[300]} strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div style={{ marginTop: spacing[3] }}>Your generated document will appear here</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
