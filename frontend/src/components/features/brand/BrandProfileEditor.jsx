import { useState, useEffect } from 'react'
import { Input, Textarea, Button, Card } from '@/components/ui'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const SECTIONS = [
  { id: 'identity', label: 'Identity', icon: '◆' },
  { id: 'mission', label: 'Mission', icon: '◎' },
  { id: 'story', label: 'Story', icon: '✦' },
  { id: 'metaphors', label: 'Metaphors', icon: '≈' },
  { id: 'values', label: 'Values', icon: '♦' },
  { id: 'archetypes', label: 'Archetypes', icon: '⬡' },
  { id: 'messaging', label: 'Messaging', icon: '✧' },
  { id: 'colours', label: 'Colours', icon: '●' },
  { id: 'typography', label: 'Typography', icon: 'Aa' },
  { id: 'imagery', label: 'Imagery', icon: '▣' },
  { id: 'logos', label: 'Logos', icon: '◈' },
  { id: 'guide', label: 'Brand Guide', icon: '▤' },
]

export default function BrandProfileEditor({ profile, clientId, onSaveSection, onExtract, extracting = false, logos = [], onAddLogo, onDeleteLogo, saving = false }) {
  const [activeSection, setActiveSection] = useState('identity')
  const [form, setForm] = useState(getDefaultForm())
  const [savedSections, setSavedSections] = useState({})
  const [populatedSections, setPopulatedSections] = useState({})
  const [importExpanded, setImportExpanded] = useState(!profile)
  const [selectedFile, setSelectedFile] = useState(null)
  const [extractionDone, setExtractionDone] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  function getDefaultForm() {
    return {
      industry: '', tagline: '',
      mission_statement: '', target_audience: '', strategic_tasks: '',
      founder_story: '', brand_narrative: '',
      metaphors: [],
      brand_values: [],
      archetypes: [],
      messaging_pillars: [],
      colours_primary: [], colours_secondary: [],
      typography: [],
      imagery_guidelines: { backgrounds: [], notes: '', template_descriptions: [] },
      voice_tone: '', core_values: '', dos: '', donts: '', additional_notes: '',
      brand_guide_path: '',
    }
  }

  useEffect(() => {
    if (profile) {
      setForm({
        industry: profile.industry || '',
        tagline: profile.tagline || '',
        mission_statement: profile.mission_statement || '',
        target_audience: profile.target_audience || '',
        strategic_tasks: profile.strategic_tasks || '',
        founder_story: profile.founder_story || '',
        brand_narrative: profile.brand_narrative || '',
        metaphors: safeArray(profile.metaphors),
        brand_values: safeArray(profile.brand_values),
        archetypes: safeArray(profile.archetypes),
        messaging_pillars: safeArray(profile.messaging_pillars),
        colours_primary: safeArray(profile.colours_primary),
        colours_secondary: safeArray(profile.colours_secondary),
        typography: safeArray(profile.typography),
        imagery_guidelines: profile.imagery_guidelines || { backgrounds: [], notes: '', template_descriptions: [] },
        voice_tone: profile.voice_tone || '',
        core_values: profile.core_values || '',
        dos: profile.dos || '',
        donts: profile.donts || '',
        additional_notes: profile.additional_notes || '',
        brand_guide_path: profile.brand_guide_path || '',
      })
    }
  }, [profile])

  function safeArray(val) {
    if (Array.isArray(val)) return val
    if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return [] } }
    return []
  }

  // Apply extracted data from PDF to the form
  const applyExtractedData = (data) => {
    const newForm = { ...form }
    const populated = {}

    // Map extracted fields to form fields and track which sections got data
    const fieldToSection = {}
    for (const section of SECTIONS) {
      for (const field of getSectionFields(section.id)) {
        fieldToSection[field] = section.id
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (key === '_company_name') continue
      if (value === null || value === undefined) continue
      if (typeof value === 'string' && !value.trim()) continue
      if (Array.isArray(value) && value.length === 0) continue

      if (key in newForm) {
        newForm[key] = value
        const section = fieldToSection[key]
        if (section) populated[section] = true
      }
    }

    setForm(newForm)
    setPopulatedSections(populated)
    setExtractionDone(true)
    setImportExpanded(false)
  }

  const handleExtract = async () => {
    if (!selectedFile || !onExtract) return
    const result = await onExtract(selectedFile)
    if (result) applyExtractedData(result)
  }

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = () => {
    const sectionFields = getSectionFields(activeSection)
    const data = {}
    for (const key of sectionFields) {
      data[key] = form[key]
    }
    if (onSaveSection) {
      onSaveSection(data)
      setSavedSections(prev => ({ ...prev, [activeSection]: true }))
      setTimeout(() => setSavedSections(prev => ({ ...prev, [activeSection]: false })), 2000)
    }
  }

  function getSectionFields(section) {
    switch (section) {
      case 'identity': return ['industry', 'tagline']
      case 'mission': return ['mission_statement', 'target_audience', 'strategic_tasks']
      case 'story': return ['founder_story', 'brand_narrative']
      case 'metaphors': return ['metaphors']
      case 'values': return ['brand_values']
      case 'archetypes': return ['archetypes']
      case 'messaging': return ['messaging_pillars']
      case 'colours': return ['colours_primary', 'colours_secondary']
      case 'typography': return ['typography']
      case 'imagery': return ['imagery_guidelines']
      case 'logos': return []
      case 'guide': return ['brand_guide_path', 'voice_tone', 'core_values', 'dos', 'donts', 'additional_notes']
      default: return []
    }
  }

  // --- Dynamic list helpers ---
  const addItem = (field, template) => set(field, [...(form[field] || []), template])
  const removeItem = (field, index) => set(field, form[field].filter((_, i) => i !== index))
  const updateItem = (field, index, key, value) =>
    set(field, form[field].map((item, i) => i === index ? { ...item, [key]: value } : item))

  // --- Render helpers ---
  const renderField = (label, field, placeholder, rows = 3) => (
    <div style={{ marginBottom: spacing[4] }}>
      <Label>{label}</Label>
      <Textarea value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} rows={rows} disabled={saving} />
    </div>
  )

  const renderInput = (label, field, placeholder) => (
    <div style={{ marginBottom: spacing[4] }}>
      <Label>{label}</Label>
      <Input value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} disabled={saving} />
    </div>
  )

  // --- Section renderers ---
  const renderIdentity = () => (
    <>
      {profile?.client_name && (
        <div style={{ marginBottom: spacing[4], padding: spacing[3], backgroundColor: colours.neutral[100], borderRadius: radii.md }}>
          <Label>Client</Label>
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
            {profile.client_name} {profile.client_company && `— ${profile.client_company}`}
          </div>
        </div>
      )}
      {renderInput('Industry', 'industry', 'e.g., Fitness & Wellness')}
      {renderInput('Tagline', 'tagline', 'e.g., Strength in Every Step')}
    </>
  )

  const renderMission = () => (
    <>
      {renderField('Mission Statement', 'mission_statement', 'Why does this brand exist?', 4)}
      {renderField('Target Audience', 'target_audience', 'Who does the brand serve?', 4)}
      {renderField('Strategic Tasks', 'strategic_tasks', 'Key strategic objectives and goals...', 4)}
    </>
  )

  const renderStory = () => (
    <>
      {renderField('Founder Story', 'founder_story', 'The origin story of the brand...', 6)}
      {renderField('Brand Narrative', 'brand_narrative', 'The overarching brand story and message...', 6)}
    </>
  )

  const renderMetaphors = () => (
    <>
      <DynamicList
        items={form.metaphors}
        onAdd={() => addItem('metaphors', { name: '', description: '' })}
        onRemove={(i) => removeItem('metaphors', i)}
        addLabel="+ Add Metaphor"
        disabled={saving}
        renderItem={(item, i) => (
          <div style={dynamicRowStyle}>
            <Input value={item.name} onChange={e => updateItem('metaphors', i, 'name', e.target.value)} placeholder="Metaphor name" disabled={saving} />
            <Textarea value={item.description} onChange={e => updateItem('metaphors', i, 'description', e.target.value)} placeholder="Description..." rows={2} disabled={saving} />
          </div>
        )}
      />
    </>
  )

  const renderValues = () => (
    <>
      <DynamicList
        items={form.brand_values}
        onAdd={() => addItem('brand_values', { name: '', tagline: '', narrative: '' })}
        onRemove={(i) => removeItem('brand_values', i)}
        addLabel="+ Add Value"
        disabled={saving}
        renderItem={(item, i) => (
          <div style={dynamicRowStyle}>
            <Input value={item.name} onChange={e => updateItem('brand_values', i, 'name', e.target.value)} placeholder="Value name" disabled={saving} />
            <Input value={item.tagline} onChange={e => updateItem('brand_values', i, 'tagline', e.target.value)} placeholder="Value tagline" disabled={saving} />
            <Textarea value={item.narrative} onChange={e => updateItem('brand_values', i, 'narrative', e.target.value)} placeholder="Value narrative..." rows={2} disabled={saving} />
          </div>
        )}
      />
    </>
  )

  const renderArchetypes = () => (
    <>
      <DynamicList
        items={form.archetypes}
        onAdd={() => addItem('archetypes', { name: '', description: '' })}
        onRemove={(i) => removeItem('archetypes', i)}
        addLabel="+ Add Archetype"
        disabled={saving}
        renderItem={(item, i) => (
          <div style={dynamicRowStyle}>
            <Input value={item.name} onChange={e => updateItem('archetypes', i, 'name', e.target.value)} placeholder="Archetype name" disabled={saving} />
            <Textarea value={item.description} onChange={e => updateItem('archetypes', i, 'description', e.target.value)} placeholder="Description..." rows={2} disabled={saving} />
          </div>
        )}
      />
    </>
  )

  const renderMessaging = () => {
    const pillars = form.messaging_pillars || []
    const setPillars = (val) => set('messaging_pillars', val)

    const addPillar = () => setPillars([...pillars, { pillar_name: '', phrases: [''] }])
    const removePillar = (i) => setPillars(pillars.filter((_, idx) => idx !== i))
    const updatePillarName = (i, val) => setPillars(pillars.map((p, idx) => idx === i ? { ...p, pillar_name: val } : p))
    const addPhrase = (i) => setPillars(pillars.map((p, idx) => idx === i ? { ...p, phrases: [...p.phrases, ''] } : p))
    const removePhrase = (pi, phi) => setPillars(pillars.map((p, idx) => idx === pi ? { ...p, phrases: p.phrases.filter((_, j) => j !== phi) } : p))
    const updatePhrase = (pi, phi, val) => setPillars(pillars.map((p, idx) => idx === pi ? { ...p, phrases: p.phrases.map((ph, j) => j === phi ? val : ph) } : p))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        {pillars.map((pillar, pi) => (
          <div key={pi} style={{ padding: spacing[4], backgroundColor: colours.neutral[100], borderRadius: radii.lg, border: `1px solid ${colours.neutral[200]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
              <Input value={pillar.pillar_name} onChange={e => updatePillarName(pi, e.target.value)} placeholder="Pillar name" disabled={saving} style={{ flex: 1, marginRight: spacing[2] }} />
              <Button type="button" variant="danger" size="sm" onClick={() => removePillar(pi)} disabled={saving}>Remove</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {(pillar.phrases || []).map((phrase, phi) => (
                <div key={phi} style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                  <Input value={phrase} onChange={e => updatePhrase(pi, phi, e.target.value)} placeholder="Phrase..." disabled={saving} style={{ flex: 1 }} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePhrase(pi, phi)} disabled={saving || pillar.phrases.length <= 1}>x</Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => addPhrase(pi)} disabled={saving} style={{ marginTop: spacing[2] }}>+ Add Phrase</Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addPillar} disabled={saving}>+ Add Messaging Pillar</Button>
      </div>
    )
  }

  const renderColours = () => {
    const renderPalette = (label, field) => (
      <div style={{ marginBottom: spacing[6] }}>
        <Label>{label}</Label>
        <DynamicList
          items={form[field]}
          onAdd={() => addItem(field, { name: '', hex: '#ffffff', pantone: '' })}
          onRemove={(i) => removeItem(field, i)}
          addLabel="+ Add Colour"
          disabled={saving}
          renderItem={(item, i) => (
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 120px', gap: spacing[2], alignItems: 'center' }}>
              <input
                type="color"
                value={item.hex || '#ffffff'}
                onChange={e => updateItem(field, i, 'hex', e.target.value)}
                disabled={saving}
                style={{ width: 40, height: 40, border: 'none', borderRadius: radii.md, cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <Input value={item.name} onChange={e => updateItem(field, i, 'name', e.target.value)} placeholder="Name" disabled={saving} />
              <Input value={item.hex} onChange={e => updateItem(field, i, 'hex', e.target.value)} placeholder="#hex" disabled={saving} style={{ fontFamily: typography.fontFamily.mono }} />
              <Input value={item.pantone} onChange={e => updateItem(field, i, 'pantone', e.target.value)} placeholder="Pantone" disabled={saving} />
            </div>
          )}
        />
      </div>
    )

    return (
      <>
        {renderPalette('Primary Palette', 'colours_primary')}
        {renderPalette('Secondary Palette', 'colours_secondary')}
      </>
    )
  }

  const renderTypography = () => (
    <DynamicList
      items={form.typography}
      onAdd={() => addItem('typography', { role: '', font_family: '', weight: '', tracking: '', case_rule: '' })}
      onRemove={(i) => removeItem('typography', i)}
      addLabel="+ Add Typography Rule"
      disabled={saving}
      renderItem={(item, i) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 100px', gap: spacing[2], alignItems: 'center' }}>
          <Input value={item.role} onChange={e => updateItem('typography', i, 'role', e.target.value)} placeholder="Role (e.g., Heading)" disabled={saving} />
          <Input value={item.font_family} onChange={e => updateItem('typography', i, 'font_family', e.target.value)} placeholder="Font family" disabled={saving} />
          <Input value={item.weight} onChange={e => updateItem('typography', i, 'weight', e.target.value)} placeholder="Weight" disabled={saving} />
          <Input value={item.tracking} onChange={e => updateItem('typography', i, 'tracking', e.target.value)} placeholder="Track" disabled={saving} />
          <Input value={item.case_rule} onChange={e => updateItem('typography', i, 'case_rule', e.target.value)} placeholder="Case" disabled={saving} />
        </div>
      )}
    />
  )

  const renderImagery = () => {
    const img = form.imagery_guidelines || { backgrounds: [], notes: '', template_descriptions: [] }
    const setImg = (val) => set('imagery_guidelines', val)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        <div>
          <Label>Backgrounds</Label>
          <DynamicList
            items={img.backgrounds || []}
            onAdd={() => setImg({ ...img, backgrounds: [...(img.backgrounds || []), ''] })}
            onRemove={(i) => setImg({ ...img, backgrounds: img.backgrounds.filter((_, idx) => idx !== i) })}
            addLabel="+ Add Background"
            disabled={saving}
            renderItem={(item, i) => (
              <Input
                value={item}
                onChange={e => setImg({ ...img, backgrounds: img.backgrounds.map((b, idx) => idx === i ? e.target.value : b) })}
                placeholder="e.g., Dark textured concrete"
                disabled={saving}
              />
            )}
          />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={img.notes || ''} onChange={e => setImg({ ...img, notes: e.target.value })} placeholder="General imagery notes..." rows={4} disabled={saving} />
        </div>
        <div>
          <Label>Template Descriptions</Label>
          <DynamicList
            items={img.template_descriptions || []}
            onAdd={() => setImg({ ...img, template_descriptions: [...(img.template_descriptions || []), ''] })}
            onRemove={(i) => setImg({ ...img, template_descriptions: img.template_descriptions.filter((_, idx) => idx !== i) })}
            addLabel="+ Add Template Description"
            disabled={saving}
            renderItem={(item, i) => (
              <Textarea
                value={item}
                onChange={e => setImg({ ...img, template_descriptions: img.template_descriptions.map((t, idx) => idx === i ? e.target.value : t) })}
                placeholder="Describe a visual template..."
                rows={2}
                disabled={saving}
              />
            )}
          />
        </div>
      </div>
    )
  }

  const renderLogos = () => {
    const [newLogo, setNewLogo] = useState({ variant_name: '', file_path: '', background_type: 'transparent', logo_type: 'primary' })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        {logos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: spacing[3] }}>
            {logos.map(logo => (
              <div key={logo.id} style={{ padding: spacing[3], backgroundColor: colours.neutral[100], borderRadius: radii.lg, border: `1px solid ${colours.neutral[200]}` }}>
                <img src={logo.file_path} alt={logo.variant_name} style={{ width: '100%', height: 80, objectFit: 'contain', marginBottom: spacing[2], backgroundColor: logo.background_type === 'dark' ? '#000' : logo.background_type === 'light' ? '#fff' : 'transparent', borderRadius: radii.sm }} />
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>{logo.variant_name || 'Untitled'}</div>
                <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginBottom: spacing[2] }}>{logo.logo_type} / {logo.background_type}</div>
                <Button type="button" variant="danger" size="sm" onClick={() => onDeleteLogo && onDeleteLogo(logo.id)} disabled={saving}>Delete</Button>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: spacing[4], backgroundColor: colours.neutral[100], borderRadius: radii.lg, border: `1px solid ${colours.neutral[200]}` }}>
          <Label>Add Logo Variant</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3], marginBottom: spacing[3] }}>
            <Input value={newLogo.variant_name} onChange={e => setNewLogo(prev => ({ ...prev, variant_name: e.target.value }))} placeholder="Variant name" disabled={saving} />
            <Input value={newLogo.file_path} onChange={e => setNewLogo(prev => ({ ...prev, file_path: e.target.value }))} placeholder="File path / URL" disabled={saving} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: spacing[3] }}>
            <select value={newLogo.background_type} onChange={e => setNewLogo(prev => ({ ...prev, background_type: e.target.value }))} disabled={saving} style={selectStyle}>
              <option value="transparent">Transparent</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <select value={newLogo.logo_type} onChange={e => setNewLogo(prev => ({ ...prev, logo_type: e.target.value }))} disabled={saving} style={selectStyle}>
              <option value="primary">Primary</option>
              <option value="wordmark">Wordmark</option>
              <option value="icon">Icon</option>
            </select>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                if (newLogo.file_path && onAddLogo) {
                  onAddLogo(newLogo)
                  setNewLogo({ variant_name: '', file_path: '', background_type: 'transparent', logo_type: 'primary' })
                }
              }}
              disabled={saving || !newLogo.file_path}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderGuide = () => (
    <>
      {renderInput('Brand Guide PDF Path', 'brand_guide_path', 'URL or path to brand guide PDF')}
      {renderField('Voice & Tone', 'voice_tone', 'Communication style and personality...', 4)}
      {renderField('Core Values (legacy)', 'core_values', 'What does the brand stand for?', 3)}
      {renderField('Do\'s', 'dos', 'What should be done when using the brand?', 3)}
      {renderField('Don\'ts', 'donts', 'What should be avoided?', 3)}
      {renderField('Additional Notes', 'additional_notes', 'Any other brand information...', 3)}
    </>
  )

  const sectionRenderers = {
    identity: renderIdentity,
    mission: renderMission,
    story: renderStory,
    metaphors: renderMetaphors,
    values: renderValues,
    archetypes: renderArchetypes,
    messaging: renderMessaging,
    colours: renderColours,
    typography: renderTypography,
    imagery: renderImagery,
    logos: renderLogos,
    guide: renderGuide,
  }

  const currentSection = SECTIONS.find(s => s.id === activeSection)
  const isLogoSection = activeSection === 'logos'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
      {/* Import from Brand Guide panel */}
      {onExtract && (
        <div style={{ border: `1px solid ${colours.neutral[200]}`, borderRadius: radii.lg, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setImportExpanded(!importExpanded)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              padding: `${spacing[3]} ${spacing[4]}`, backgroundColor: colours.neutral[100],
              border: 'none', cursor: 'pointer', fontFamily: typography.fontFamily.sans,
            }}
          >
            <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
              Import from Brand Guide
            </span>
            <span style={{ color: colours.neutral[500], fontSize: typography.fontSize.lg }}>
              {importExpanded ? '−' : '+'}
            </span>
          </button>

          {importExpanded && (
            <div style={{ padding: spacing[5] }}>
              {extracting ? (
                <div style={{ textAlign: 'center', padding: spacing[8] }}>
                  <div style={{ width: 32, height: 32, border: `3px solid ${colours.neutral[200]}`, borderTopColor: colours.primary[500], borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto', marginBottom: spacing[3] }} />
                  <p style={{ color: colours.neutral[700], fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium }}>Analyzing brand guide...</p>
                  <p style={{ color: colours.neutral[500], fontSize: typography.fontSize.sm, marginTop: spacing[1] }}>Extracting brand profile data with AI</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              ) : (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && f.type === 'application/pdf') setSelectedFile(f) }}
                    onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf'; input.onchange = e => { if (e.target.files[0]) setSelectedFile(e.target.files[0]) }; input.click() }}
                    style={{
                      padding: spacing[6], border: `2px dashed ${dragOver ? colours.primary[500] : colours.neutral[300]}`,
                      borderRadius: radii.lg, textAlign: 'center', cursor: 'pointer',
                      backgroundColor: dragOver ? colours.neutral[200] : 'transparent',
                      transition: `all ${transitions.fast}`, marginBottom: spacing[4],
                    }}
                  >
                    {selectedFile ? (
                      <div>
                        <p style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>{selectedFile.name}</p>
                        <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginTop: spacing[1] }}>{(selectedFile.size / 1024).toFixed(0)} KB — Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '28px', color: colours.neutral[400], marginBottom: spacing[2] }}>PDF</p>
                        <p style={{ fontSize: typography.fontSize.base, color: colours.neutral[600] }}>Drop a brand guide PDF here, or click to browse</p>
                        <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginTop: spacing[1] }}>Accepts .pdf files</p>
                      </div>
                    )}
                  </div>

                  {selectedFile && (
                    <Button type="button" variant="primary" onClick={handleExtract} disabled={extracting}>
                      Extract Brand Profile
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success banner */}
      {extractionDone && (
        <div style={{ padding: `${spacing[3]} ${spacing[4]}`, backgroundColor: colours.success[500] + '18', border: `1px solid ${colours.success[500]}40`, borderRadius: radii.lg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.success[500] }}>
            Brand profile extracted! Review each section and save.
          </span>
          <button type="button" onClick={() => setExtractionDone(false)} style={{ background: 'none', border: 'none', color: colours.success[500], cursor: 'pointer', fontSize: typography.fontSize.lg, fontFamily: typography.fontFamily.sans }}>x</button>
        </div>
      )}

      {/* Editor grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: spacing[6], minHeight: '600px' }}>
        {/* Left nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {SECTIONS.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: spacing[2],
                padding: `${spacing[2]} ${spacing[3]}`,
                backgroundColor: activeSection === section.id ? colours.neutral[200] : 'transparent',
                color: activeSection === section.id ? colours.neutral[900] : colours.neutral[600],
                border: 'none', borderRadius: radii.md, cursor: 'pointer',
                fontSize: typography.fontSize.sm, fontWeight: activeSection === section.id ? typography.fontWeight.semibold : typography.fontWeight.medium,
                fontFamily: typography.fontFamily.sans,
                textAlign: 'left', transition: `all ${transitions.fast}`,
              }}
            >
              <span style={{ width: 20, textAlign: 'center', fontSize: typography.fontSize.xs }}>{section.icon}</span>
              {section.label}
              {populatedSections[section.id] && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colours.success[500], marginLeft: 'auto', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </nav>

        {/* Right content */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6], paddingBottom: spacing[4], borderBottom: `1px solid ${colours.neutral[200]}` }}>
            <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>
              {currentSection?.label}
            </h2>
            {!isLogoSection && (
              <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : savedSections[activeSection] ? 'Saved!' : 'Save Section'}
              </Button>
            )}
          </div>
          {sectionRenderers[activeSection]?.()}
        </div>
      </div>
    </div>
  )
}

// --- Shared sub-components ---

function Label({ children }) {
  return (
    <label style={{
      display: 'block',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colours.neutral[700],
      marginBottom: spacing[2],
    }}>
      {children}
    </label>
  )
}

function DynamicList({ items, onAdd, onRemove, addLabel, disabled, renderItem }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
      {items.map((item, index) => (
        <div key={index} style={{ position: 'relative', padding: spacing[3], backgroundColor: colours.neutral[100], borderRadius: radii.lg, border: `1px solid ${colours.neutral[200]}` }}>
          {renderItem(item, index)}
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onRemove(index)}
            disabled={disabled}
            style={{ position: 'absolute', top: spacing[2], right: spacing[2] }}
          >
            x
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={onAdd} disabled={disabled}>
        {addLabel}
      </Button>
    </div>
  )
}

const dynamicRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  paddingRight: spacing[8],
}

const selectStyle = {
  padding: `${spacing[2]} ${spacing[3]}`,
  backgroundColor: colours.white,
  color: colours.neutral[900],
  border: `1px solid ${colours.neutral[300]}`,
  borderRadius: radii.md,
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.sans,
}
