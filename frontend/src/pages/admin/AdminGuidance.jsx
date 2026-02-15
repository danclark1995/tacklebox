import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, BookOpen, Palette, CheckCircle, Pencil, Save, Plus, X } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { GlowCard, Button, Input, Textarea, EmberLoader, PageHeader } from '@/components/ui'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { getContractorXP } from '@/services/gamification'
import { colours, spacing, typography, radii } from '@/config/tokens'

// ── Fallback data if API has no rows yet ─────────────────────────
const FALLBACK_PROMPT_SECTIONS = [
  { section_key: 'prompt_social', title: 'Social Media', content: [
    { tip: 'Specify the platform', example: '"Create an Instagram carousel post" is better than "Create a social media post"' },
    { tip: 'Include the goal', example: '"Drive traffic to our new product launch page" gives the AI clear intent' },
  ]},
  { section_key: 'prompt_documents', title: 'Documents', content: [
    { tip: 'Define the document type clearly', example: '"Write a one-page executive summary" vs "Write a document"' },
    { tip: 'Specify the reading level', example: '"Write for a general audience with no technical jargon"' },
  ]},
  { section_key: 'prompt_presentations', title: 'Presentations', content: [
    { tip: 'Define the slide count and flow', example: '"Create a 10-slide pitch deck: problem, solution, market, traction, team, ask"' },
  ]},
  { section_key: 'prompt_ads', title: 'Ad Creatives', content: [
    { tip: 'State the ad placement', example: '"Facebook feed ad, 1080x1080" is more useful than "Create an ad"' },
  ]},
]

const FALLBACK_CHECKLISTS = {
  brand_checklist: ['Brand story and origin narrative', 'Core messaging pillars', 'Tone of voice guidelines', 'Visual identity guidelines', 'Target audience profiles'],
  quality_checklist: ['Content aligns with brand voice', 'No factual errors', 'Appropriate length for platform', 'Grammar and spelling are correct'],
}

const SECTION_ICONS = {
  prompt_social: BookOpen,
  prompt_documents: BookOpen,
  prompt_presentations: BookOpen,
  prompt_ads: BookOpen,
  brand_checklist: Palette,
  quality_checklist: CheckCircle,
}

// ── Main Component ───────────────────────────────────────────────
export default function AdminGuidance() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  // Check edit permissions
  useEffect(() => {
    async function checkPermissions() {
      if (user?.role === 'admin') {
        setCanEdit(true)
        return
      }
      if (user?.role === 'contractor') {
        try {
          const xpData = await getContractorXP(user.id)
          if (xpData?.current_level >= 7) setCanEdit(true)
        } catch {}
      }
    }
    checkPermissions()
  }, [user])

  // Load guidance sections
  useEffect(() => {
    async function loadSections() {
      try {
        const res = await fetch(apiEndpoint('/guidance'), { headers: { ...getAuthHeaders() } })
        const json = await res.json()
        if (json.success && json.data?.length > 0) {
          setSections(json.data)
        } else {
          // Use fallback data if table doesn't exist yet
          setSections([
            ...FALLBACK_PROMPT_SECTIONS,
            { section_key: 'brand_checklist', title: 'Brand Voice Guidelines', content: FALLBACK_CHECKLISTS.brand_checklist },
            { section_key: 'quality_checklist', title: 'Quality Standards', content: FALLBACK_CHECKLISTS.quality_checklist },
          ])
        }
      } catch {
        // Fallback to hardcoded content
        setSections([
          ...FALLBACK_PROMPT_SECTIONS,
          { section_key: 'brand_checklist', title: 'Brand Voice Guidelines', content: FALLBACK_CHECKLISTS.brand_checklist },
          { section_key: 'quality_checklist', title: 'Quality Standards', content: FALLBACK_CHECKLISTS.quality_checklist },
        ])
      } finally {
        setLoading(false)
      }
    }
    loadSections()
  }, [])

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))

  const startEditing = (section) => {
    setEditingKey(section.section_key)
    setEditDraft(JSON.parse(JSON.stringify(section.content)))
  }

  const cancelEditing = () => { setEditingKey(null); setEditDraft(null) }

  const saveSection = async (sectionKey) => {
    setSaving(true)
    try {
      const res = await fetch(apiEndpoint(`/guidance/${encodeURIComponent(sectionKey)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ content: editDraft }),
      })
      const json = await res.json()
      if (json.success) {
        setSections(prev => prev.map(s => s.section_key === sectionKey ? { ...s, content: json.data.content } : s))
        setEditingKey(null)
        setEditDraft(null)
        addToast('Section saved', 'success')
      } else {
        addToast(json.error || 'Failed to save', 'error')
      }
    } catch {
      addToast('Failed to save section', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Split sections into prompt tips and checklists
  const promptSections = sections.filter(s => s.section_key.startsWith('prompt_'))
  const brandChecklist = sections.find(s => s.section_key === 'brand_checklist')
  const qualityChecklist = sections.find(s => s.section_key === 'quality_checklist')

  if (loading) {
    return (
      <div style={{ fontFamily: typography.fontFamily.sans }}>
        <PageHeader title="AI & Content Guidance" subtitle="Best practices for AI-generated content" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[16] }}>
          <EmberLoader size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: typography.fontFamily.sans }}>
      <PageHeader title="AI & Content Guidance" subtitle="Best practices for AI-generated content" />

      {/* Prompt Best Practices */}
      <div style={{ marginBottom: spacing[8] }}>
        <h2 style={sectionHeadingStyle}>
          <BookOpen size={18} />
          Prompt Best Practices
        </h2>
        <GlowCard padding="24px">
          <p style={introStyle}>
            Well-crafted prompts produce better AI output. Expand each content type for specific tips.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {promptSections.map(section => {
              const isOpen = expandedSections[section.section_key]
              const isEditing = editingKey === section.section_key
              const tips = isEditing ? editDraft : (section.content || [])

              return (
                <div key={section.section_key} style={{ borderBottom: `1px solid ${colours.neutral[200]}` }}>
                  {/* Accordion header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: `${spacing[3]} 0`, cursor: 'pointer',
                  }} onClick={() => toggleSection(section.section_key)}>
                    <span style={{ fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], fontSize: typography.fontSize.sm }}>
                      {section.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                      {canEdit && isOpen && !isEditing && (
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); startEditing(section) }}>
                          <Pencil size={14} />
                        </Button>
                      )}
                      {isOpen ? <ChevronUp size={16} color={colours.neutral[500]} /> : <ChevronDown size={16} color={colours.neutral[500]} />}
                    </div>
                  </div>

                  {/* Accordion content */}
                  {isOpen && (
                    <div style={{ paddingBottom: spacing[4] }}>
                      {isEditing ? (
                        <TipEditor
                          tips={editDraft}
                          onChange={setEditDraft}
                          onSave={() => saveSection(section.section_key)}
                          onCancel={cancelEditing}
                          saving={saving}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                          {Array.isArray(tips) && tips.map((item, i) => (
                            <div key={i} style={{ paddingLeft: spacing[3], borderLeft: `2px solid ${colours.neutral[200]}` }}>
                              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900], marginBottom: '4px' }}>
                                {item.tip}
                              </div>
                              <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], fontStyle: 'italic', lineHeight: 1.5 }}>
                                {item.example}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlowCard>
      </div>

      {/* Brand Checklist */}
      {brandChecklist && (
        <ChecklistSection
          icon={Palette}
          title="Brand Voice Guidelines"
          intro="The AI uses brand profiles to tailor generated content. The more detail in the brand profile, the better the output."
          subheading="Brand Profile Checklist"
          items={brandChecklist.content}
          sectionKey={brandChecklist.section_key}
          canEdit={canEdit}
          isEditing={editingKey === brandChecklist.section_key}
          editDraft={editDraft}
          onStartEdit={() => startEditing(brandChecklist)}
          onChangeDraft={setEditDraft}
          onSave={() => saveSection(brandChecklist.section_key)}
          onCancel={cancelEditing}
          saving={saving}
        />
      )}

      {/* Quality Checklist */}
      {qualityChecklist && (
        <ChecklistSection
          icon={CheckCircle}
          title="Quality Standards"
          intro="Use this checklist before approving any AI-generated content."
          subheading="Review Checklist"
          items={qualityChecklist.content}
          sectionKey={qualityChecklist.section_key}
          canEdit={canEdit}
          isEditing={editingKey === qualityChecklist.section_key}
          editDraft={editDraft}
          onStartEdit={() => startEditing(qualityChecklist)}
          onChangeDraft={setEditDraft}
          onSave={() => saveSection(qualityChecklist.section_key)}
          onCancel={cancelEditing}
          saving={saving}
        />
      )}
    </div>
  )
}

// ── Tip Editor (for prompt sections) ─────────────────────────────
function TipEditor({ tips, onChange, onSave, onCancel, saving }) {
  const updateTip = (index, field, value) => {
    const updated = [...tips]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const addTip = () => onChange([...tips, { tip: '', example: '' }])

  const removeTip = (index) => onChange(tips.filter((_, i) => i !== index))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
      {tips.map((item, i) => (
        <div key={i} style={{
          padding: spacing[3], backgroundColor: colours.neutral[100],
          borderRadius: radii.md, position: 'relative',
        }}>
          <Input
            value={item.tip}
            onChange={e => updateTip(i, 'tip', e.target.value)}
            placeholder="Tip title"
            disabled={saving}
          />
          <div style={{ height: spacing[2] }} />
          <Textarea
            value={item.example}
            onChange={e => updateTip(i, 'example', e.target.value)}
            placeholder="Example text..."
            rows={2}
            autoGrow
            disabled={saving}
          />
          {tips.length > 1 && (
            <Button
              variant="ghost" size="sm"
              onClick={() => removeTip(i)}
              disabled={saving}
              style={{ position: 'absolute', top: spacing[2], right: spacing[2] }}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: spacing[2] }}>
        <Button variant="ghost" size="sm" onClick={addTip} disabled={saving}>
          <Plus size={14} style={{ marginRight: '4px' }} /> Add Tip
        </Button>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
          <Save size={14} style={{ marginRight: '4px' }} /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

// ── Checklist Section ────────────────────────────────────────────
function ChecklistSection({ icon: Icon, title, intro, subheading, items, sectionKey, canEdit, isEditing, editDraft, onStartEdit, onChangeDraft, onSave, onCancel, saving }) {
  const displayItems = isEditing ? editDraft : (Array.isArray(items) ? items : [])

  const updateItem = (index, value) => {
    const updated = [...editDraft]
    updated[index] = value
    onChangeDraft(updated)
  }

  const addItem = () => onChangeDraft([...editDraft, ''])
  const removeItem = (index) => onChangeDraft(editDraft.filter((_, i) => i !== index))

  return (
    <div style={{ marginBottom: spacing[8] }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4] }}>
        <h2 style={sectionHeadingStyle}>
          <Icon size={18} />
          {title}
        </h2>
        {canEdit && !isEditing && (
          <Button variant="ghost" size="sm" onClick={onStartEdit}>
            <Pencil size={14} style={{ marginRight: '4px' }} /> Edit
          </Button>
        )}
      </div>

      <GlowCard padding="24px">
        <p style={introStyle}>{intro}</p>

        <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[3] }}>
          {subheading}
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {displayItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                <Input value={item} onChange={e => updateItem(i, e.target.value)} placeholder="Checklist item..." disabled={saving} />
                {displayItems.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeItem(i)} disabled={saving}>
                    <X size={14} />
                  </Button>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[2] }}>
              <Button variant="ghost" size="sm" onClick={addItem} disabled={saving}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Add Item
              </Button>
              <div style={{ flex: 1 }} />
              <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
                <Save size={14} style={{ marginRight: '4px' }} /> {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {displayItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[2], fontSize: typography.fontSize.sm, color: colours.neutral[500], lineHeight: 1.5 }}>
                <CheckCircle size={14} color={colours.neutral[400]} style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </GlowCard>
    </div>
  )
}

// ── Shared styles ────────────────────────────────────────────────
const sectionHeadingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[900],
  marginBottom: spacing[4],
  marginTop: 0,
}

const introStyle = {
  fontSize: typography.fontSize.sm,
  color: colours.neutral[500],
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: spacing[4],
}
