import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Check, ArrowLeft, ArrowRight, Plus, X } from 'lucide-react'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import useToast from '@/hooks/useToast'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography, radii } from '@/config/tokens'

const STEPS = [
  { label: 'Client Details' },
  { label: 'Brand Basics' },
  { label: 'Brand Story' },
  { label: 'Brand Identity' },
  { label: 'Messaging' },
  { label: 'Review & Create' },
]

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Select an industry' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Education', label: 'Education' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Food & Beverage', label: 'Food & Beverage' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Media & Entertainment', label: 'Media & Entertainment' },
  { value: 'Fashion & Beauty', label: 'Fashion & Beauty' },
  { value: 'Travel & Hospitality', label: 'Travel & Hospitality' },
  { value: 'Non-Profit', label: 'Non-Profit' },
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Other', label: 'Other' },
]

const TONE_OPTIONS = [
  { value: '', label: 'Select a tone' },
  { value: 'Formal', label: 'Formal' },
  { value: 'Conversational', label: 'Conversational' },
  { value: 'Playful', label: 'Playful' },
  { value: 'Authoritative', label: 'Authoritative' },
  { value: 'Empathetic', label: 'Empathetic' },
  { value: 'Bold', label: 'Bold' },
  { value: 'Warm', label: 'Warm' },
  { value: 'Professional', label: 'Professional' },
]

const ARCHETYPES = [
  'The Sage', 'The Explorer', 'The Hero', 'The Outlaw',
  'The Magician', 'The Everyman', 'The Lover', 'The Jester',
  'The Caregiver', 'The Ruler', 'The Creator', 'The Innocent',
]

const INITIAL_DATA = {
  // Step 1
  client_name: '',
  client_email: '',
  company_name: '',
  industry: '',
  // Step 2
  tagline: '',
  mission_statement: '',
  target_audience: '',
  strategic_tasks: '',
  // Step 3
  founder_story: '',
  brand_narrative: '',
  milestones: '',
  // Step 4
  archetypes: [],
  brand_values: '',
  voice_tone: '',
  tone_notes: '',
  // Step 5
  pillars: [{ title: '', description: '' }],
  taglines: '',
  hashtags: '',
}

export default function BrandOnboarding() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ ...INITIAL_DATA })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [reviewExpanded, setReviewExpanded] = useState({ 0: true, 1: true, 2: true, 3: true, 4: true })

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }))

  const canNext = () => {
    if (step === 0) return data.client_name.trim() && data.client_email.trim() && data.company_name.trim()
    return true
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const goToStep = (s) => setStep(s)

  const addPillar = () => {
    if (data.pillars.length < 3) {
      update('pillars', [...data.pillars, { title: '', description: '' }])
    }
  }

  const removePillar = (index) => {
    update('pillars', data.pillars.filter((_, i) => i !== index))
  }

  const updatePillar = (index, field, value) => {
    const updated = [...data.pillars]
    updated[index] = { ...updated[index], [field]: value }
    update('pillars', updated)
  }

  const toggleArchetype = (name) => {
    const current = data.archetypes
    if (current.includes(name)) {
      update('archetypes', current.filter(a => a !== name))
    } else {
      update('archetypes', [...current, name])
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Generate temp password
      const tempPassword = 'Temp' + Math.random().toString(36).slice(2, 8) + '!'

      // 1. Create client user
      const userRes = await fetch(apiEndpoint('/users'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.client_email.trim(),
          password: tempPassword,
          role: 'client',
          display_name: data.client_name.trim(),
          company: data.company_name.trim(),
        }),
      })
      const userJson = await userRes.json()
      if (!userJson.success) {
        addToast(userJson.error || 'Failed to create client account', 'error')
        setSubmitting(false)
        return
      }

      const clientId = userJson.data.id

      // 2. Create brand profile
      const brandValues = data.brand_values.trim()
        ? data.brand_values.split(',').map(v => ({ name: v.trim(), tagline: '', narrative: '' }))
        : null

      const archetypeData = data.archetypes.length > 0
        ? data.archetypes.map(a => ({ name: a, description: '' }))
        : null

      const pillarData = data.pillars.filter(p => p.title.trim()).length > 0
        ? data.pillars.filter(p => p.title.trim()).map(p => ({
            pillar_name: p.title.trim(),
            phrases: p.description ? [p.description.trim()] : [],
          }))
        : null

      const profileRes = await fetch(apiEndpoint('/brand-profiles'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          industry: data.industry || null,
          tagline: data.tagline || null,
          mission_statement: data.mission_statement || null,
          target_audience: data.target_audience || null,
          strategic_tasks: data.strategic_tasks || null,
          founder_story: data.founder_story || null,
          brand_narrative: data.brand_narrative || null,
          additional_notes: data.milestones || null,
          voice_tone: data.voice_tone ? `${data.voice_tone}${data.tone_notes ? '. ' + data.tone_notes : ''}` : null,
          brand_values: brandValues,
          archetypes: archetypeData,
          messaging_pillars: pillarData,
        }),
      })
      const profileJson = await profileRes.json()
      if (!profileJson.success) {
        addToast(profileJson.error || 'Failed to create brand profile', 'error')
        setSubmitting(false)
        return
      }

      setResult({
        clientId,
        companyName: data.company_name,
        email: data.client_email,
        tempPassword,
      })
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setData({ ...INITIAL_DATA })
    setStep(0)
    setResult(null)
  }

  // Success screen
  if (result) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: spacing[12] }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '2px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: spacing[5],
          }}>
            <Check size={32} color="#ffffff" />
          </div>

          <h1 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing[3] }}>
            Brand Profile Created
          </h1>
          <p style={{ fontSize: typography.fontSize.base, color: colours.neutral[400], marginBottom: spacing[6], lineHeight: 1.6 }}>
            Brand profile created for {result.companyName}!
          </p>

          <GlowCard style={{ padding: spacing[5], textAlign: 'left', marginBottom: spacing[6] }}>
            <div style={{ marginBottom: spacing[3] }}>
              <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginBottom: '4px' }}>Client Login</div>
              <div style={{ fontSize: typography.fontSize.sm, color: '#ffffff' }}>{result.email}</div>
            </div>
            <div>
              <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginBottom: '4px' }}>Temporary Password</div>
              <div style={{ fontSize: typography.fontSize.sm, color: '#ffffff', fontFamily: 'monospace' }}>{result.tempPassword}</div>
            </div>
          </GlowCard>

          <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'center' }}>
            <Button onClick={() => navigate(`/admin/brands/${result.clientId}/edit`)}>
              View Brand Profile
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Create Another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>Create Brand Profile</h1>

      {/* Step Indicator */}
      <div style={stepIndicatorStyle}>
        {STEPS.map((s, i) => {
          const isCompleted = i < step
          const isCurrent = i === step
          const isFuture = i > step
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <div
                  onClick={() => i <= step && goToStep(i)}
                  style={{
                    width: isCurrent ? '32px' : '24px',
                    height: isCurrent ? '32px' : '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: i <= step ? 'pointer' : 'default',
                    backgroundColor: isCompleted ? '#ffffff' : 'transparent',
                    border: isFuture ? '2px dashed #333' : isCurrent ? '2px solid #ffffff' : '2px solid #ffffff',
                    boxShadow: isCurrent ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
                    transition: 'all 0.3s ease',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isCompleted ? '#000000' : isCurrent ? '#ffffff' : '#444',
                  }}
                >
                  {isCompleted ? <Check size={12} color="#000000" /> : i + 1}
                </div>
                <span style={{
                  fontSize: '10px',
                  color: isCurrent ? '#ffffff' : colours.neutral[500],
                  marginTop: '6px',
                  whiteSpace: 'nowrap',
                  fontWeight: isCurrent ? 600 : 400,
                }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: isCompleted ? '#ffffff' : '#333',
                  margin: '0 8px',
                  marginBottom: '20px',
                  transition: 'background-color 0.3s ease',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div style={stepContentStyle} key={step}>
        {step === 0 && <StepClientDetails data={data} update={update} />}
        {step === 1 && <StepBrandBasics data={data} update={update} />}
        {step === 2 && <StepBrandStory data={data} update={update} />}
        {step === 3 && <StepBrandIdentity data={data} update={update} toggleArchetype={toggleArchetype} />}
        {step === 4 && <StepMessaging data={data} update={update} updatePillar={updatePillar} addPillar={addPillar} removePillar={removePillar} />}
        {step === 5 && <StepReview data={data} goToStep={goToStep} expanded={reviewExpanded} setExpanded={setReviewExpanded} />}
      </div>

      {/* Navigation */}
      <div style={navBarStyle}>
        {step > 0 ? (
          <Button variant="secondary" onClick={handleBack}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={14} />
              Back
            </span>
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => navigate('/admin/brands')}>Cancel</Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canNext()}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Next
              <ArrowRight size={14} />
            </span>
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Brand Profile'}
          </Button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Step Components ──────────────────────────────────────────────────

function StepClientDetails({ data, update }) {
  return (
    <GlowCard style={{ padding: spacing[6] }}>
      <h2 style={stepTitleStyle}>Client Details</h2>
      <div style={fieldStyle}>
        <Input label="Client Name" value={data.client_name} onChange={e => update('client_name', e.target.value)} placeholder="Full name" required />
      </div>
      <div style={fieldStyle}>
        <Input label="Client Email" value={data.client_email} onChange={e => update('client_email', e.target.value)} placeholder="email@example.com" required />
      </div>
      <div style={fieldStyle}>
        <Input label="Company Name" value={data.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Company name" required />
      </div>
      <div style={fieldStyle}>
        <Select label="Industry" value={data.industry} onChange={e => update('industry', e.target.value)} options={INDUSTRY_OPTIONS} />
      </div>
    </GlowCard>
  )
}

function StepBrandBasics({ data, update }) {
  return (
    <GlowCard style={{ padding: spacing[6] }}>
      <h2 style={stepTitleStyle}>Brand Basics</h2>
      <div style={fieldStyle}>
        <Input label="Company Tagline" value={data.tagline} onChange={e => update('tagline', e.target.value)} placeholder="A short, memorable tagline" />
      </div>
      <div style={fieldStyle}>
        <Textarea label="Mission Statement" value={data.mission_statement} onChange={e => update('mission_statement', e.target.value)} placeholder="What is the company's mission?" rows={3} />
      </div>
      <div style={fieldStyle}>
        <Textarea label="Target Audience" value={data.target_audience} onChange={e => update('target_audience', e.target.value)} placeholder="Who is the primary audience?" rows={3} />
      </div>
      <div style={fieldStyle}>
        <Textarea label="Strategic Objectives" value={data.strategic_tasks} onChange={e => update('strategic_tasks', e.target.value)} placeholder="Key business goals and objectives" rows={3} />
      </div>
    </GlowCard>
  )
}

function StepBrandStory({ data, update }) {
  return (
    <GlowCard style={{ padding: spacing[6] }}>
      <h2 style={stepTitleStyle}>Brand Story</h2>
      <div style={fieldStyle}>
        <Textarea label="Founder Story" value={data.founder_story} onChange={e => update('founder_story', e.target.value)} placeholder="The story behind the founder and how the company started" rows={5} />
      </div>
      <div style={fieldStyle}>
        <Textarea label="Brand Origin" value={data.brand_narrative} onChange={e => update('brand_narrative', e.target.value)} placeholder="How did the brand come to be? What problem does it solve?" rows={4} />
      </div>
      <div style={fieldStyle}>
        <Textarea label="Key Milestones" value={data.milestones} onChange={e => update('milestones', e.target.value)} placeholder="Notable achievements, launches, or milestones" rows={3} />
      </div>
    </GlowCard>
  )
}

function StepBrandIdentity({ data, update, toggleArchetype }) {
  return (
    <GlowCard style={{ padding: spacing[6] }}>
      <h2 style={stepTitleStyle}>Brand Identity</h2>

      <div style={fieldStyle}>
        <div style={labelStyle}>Brand Archetypes</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
          {ARCHETYPES.map(name => {
            const selected = data.archetypes.includes(name)
            return (
              <Button
                key={name}
                variant={selected ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => toggleArchetype(name)}
              >
                {name}
              </Button>
            )
          })}
        </div>
      </div>

      <div style={fieldStyle}>
        <Input label="Brand Values" value={data.brand_values} onChange={e => update('brand_values', e.target.value)} placeholder="Comma-separated values (e.g., Innovation, Trust, Quality)" />
      </div>

      <div style={fieldStyle}>
        <Select label="Tone of Voice" value={data.voice_tone} onChange={e => update('voice_tone', e.target.value)} options={TONE_OPTIONS} />
      </div>

      <div style={fieldStyle}>
        <Input label="Additional Tone Notes" value={data.tone_notes} onChange={e => update('tone_notes', e.target.value)} placeholder="Any extra notes about voice and tone" />
      </div>
    </GlowCard>
  )
}

function StepMessaging({ data, update, updatePillar, addPillar, removePillar }) {
  return (
    <GlowCard style={{ padding: spacing[6] }}>
      <h2 style={stepTitleStyle}>Messaging</h2>

      <div style={fieldStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
          <div style={labelStyle}>Key Messaging Pillars (up to 3)</div>
          {data.pillars.length < 3 && (
            <Button variant="ghost" size="sm" onClick={addPillar} icon={<Plus size={14} />}>
              Add Pillar
            </Button>
          )}
        </div>
        {data.pillars.map((pillar, i) => (
          <div key={i} style={{ marginBottom: spacing[4], padding: spacing[4], border: '1px solid #1a1a1a', borderRadius: radii.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
              <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>Pillar {i + 1}</span>
              {data.pillars.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removePillar(i)} icon={<X size={14} />} />
              )}
            </div>
            <div style={{ marginBottom: spacing[2] }}>
              <Input value={pillar.title} onChange={e => updatePillar(i, 'title', e.target.value)} placeholder="Pillar title" />
            </div>
            <Textarea value={pillar.description} onChange={e => updatePillar(i, 'description', e.target.value)} placeholder="Pillar description" rows={2} />
          </div>
        ))}
      </div>

      <div style={fieldStyle}>
        <Textarea label="Example Taglines" value={data.taglines} onChange={e => update('taglines', e.target.value)} placeholder="One tagline per line" rows={3} />
      </div>

      <div style={fieldStyle}>
        <Input label="Hashtags" value={data.hashtags} onChange={e => update('hashtags', e.target.value)} placeholder="#brand #company #values" />
      </div>
    </GlowCard>
  )
}

function StepReview({ data, goToStep, expanded, setExpanded }) {
  const toggle = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))

  const sections = [
    {
      title: 'Client Details', step: 0, items: [
        { label: 'Name', value: data.client_name },
        { label: 'Email', value: data.client_email },
        { label: 'Company', value: data.company_name },
        { label: 'Industry', value: data.industry },
      ]
    },
    {
      title: 'Brand Basics', step: 1, items: [
        { label: 'Tagline', value: data.tagline },
        { label: 'Mission', value: data.mission_statement },
        { label: 'Target Audience', value: data.target_audience },
        { label: 'Strategic Objectives', value: data.strategic_tasks },
      ]
    },
    {
      title: 'Brand Story', step: 2, items: [
        { label: 'Founder Story', value: data.founder_story },
        { label: 'Brand Origin', value: data.brand_narrative },
        { label: 'Key Milestones', value: data.milestones },
      ]
    },
    {
      title: 'Brand Identity', step: 3, items: [
        { label: 'Archetypes', value: data.archetypes.join(', ') },
        { label: 'Brand Values', value: data.brand_values },
        { label: 'Tone of Voice', value: data.voice_tone },
        { label: 'Tone Notes', value: data.tone_notes },
      ]
    },
    {
      title: 'Messaging', step: 4, items: [
        { label: 'Messaging Pillars', value: data.pillars.filter(p => p.title).map(p => p.title).join(', ') },
        { label: 'Example Taglines', value: data.taglines },
        { label: 'Hashtags', value: data.hashtags },
      ]
    },
  ]

  return (
    <div>
      <h2 style={{ ...stepTitleStyle, marginBottom: spacing[5] }}>Review & Create</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        {sections.map((section, i) => (
          <GlowCard key={i} style={{ padding: 0, overflow: 'hidden' }}>
            <Button
              variant="ghost"
              onClick={() => toggle(i)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: `${spacing[3]} ${spacing[4]}`,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                borderRadius: 0,
              }}
            >
              <span>{section.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <span
                  onClick={(e) => { e.stopPropagation(); goToStep(section.step) }}
                  style={{ fontSize: '12px', color: colours.neutral[500], textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Edit
                </span>
                {expanded[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </Button>

            {expanded[i] && (
              <div style={{ padding: `0 ${spacing[4]} ${spacing[4]}`, borderTop: '1px solid #1a1a1a' }}>
                {section.items.map((item, j) => (
                  <div key={j} style={{ padding: `${spacing[2]} 0`, borderBottom: j < section.items.length - 1 ? '1px solid #111' : 'none' }}>
                    <div style={{ fontSize: '11px', color: colours.neutral[500], marginBottom: '2px' }}>{item.label}</div>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      color: item.value ? '#ffffff' : colours.neutral[600],
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                    }}>
                      {item.value || '\u2014'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlowCard>
        ))}
      </div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────

const pageStyle = {
  fontFamily: typography.fontFamily.sans,
  maxWidth: '720px',
  margin: '0 auto',
  paddingBottom: spacing[12],
}

const pageTitleStyle = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: '#ffffff',
  marginBottom: spacing[8],
  marginTop: 0,
}

const stepIndicatorStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: spacing[8],
  padding: `0 ${spacing[4]}`,
}

const stepContentStyle = {
  animation: 'fadeIn 0.3s ease',
  marginBottom: spacing[6],
}

const navBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: spacing[4],
  borderTop: '1px solid #1a1a1a',
}

const stepTitleStyle = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: '#ffffff',
  marginTop: 0,
  marginBottom: spacing[5],
}

const fieldStyle = {
  marginBottom: spacing[4],
}

const labelStyle = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colours.neutral[700],
  marginBottom: spacing[1],
  fontFamily: typography.fontFamily.sans,
}

const addPillarButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  background: 'none',
  border: '1px solid #333',
  borderRadius: radii.md,
  padding: `${spacing[1]} ${spacing[2]}`,
  cursor: 'pointer',
  color: colours.neutral[400],
  fontSize: '12px',
  fontFamily: typography.fontFamily.sans,
}
