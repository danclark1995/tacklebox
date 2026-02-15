import { colours, spacing, typography, radii } from '@/config/tokens'

/**
 * BrandProfileView — Premium magazine-style read-only brand world display.
 * Shows all brand guide sections beautifully for clients and contractors.
 */
export default function BrandProfileView({ profile, clientName, companyName, logos = [] }) {
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: spacing[10], color: colours.neutral[500] }}>
        <p>No brand profile available</p>
      </div>
    )
  }

  const safeArr = (val) => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return [] } }
    return []
  }

  const metaphors = safeArr(profile.metaphors)
  const brandValues = safeArr(profile.brand_values)
  const archetypes = safeArr(profile.archetypes)
  const messagingPillars = safeArr(profile.messaging_pillars)
  const coloursPrimary = safeArr(profile.colours_primary)
  const coloursSecondary = safeArr(profile.colours_secondary)
  const typo = safeArr(profile.typography)
  const imagery = profile.imagery_guidelines || {}
  const brandColours = safeArr(profile.brand_colours)

  const hasIdentity = profile.industry || profile.tagline
  const hasStory = profile.founder_story || profile.brand_narrative
  const hasColours = coloursPrimary.length > 0 || coloursSecondary.length > 0 || brandColours.length > 0
  const hasGuidelines = profile.dos || profile.donts

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', paddingBottom: spacing[8], borderBottom: `2px solid ${colours.neutral[200]}`, marginBottom: spacing[8] }}>
        {profile.logo_path && (
          <img src={profile.logo_path} alt={`${clientName} logo`} style={{ maxWidth: '280px', maxHeight: '120px', objectFit: 'contain', marginBottom: spacing[4] }} />
        )}
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: colours.neutral[900], marginBottom: spacing[1], letterSpacing: '-0.02em' }}>
          {clientName}
        </h1>
        {companyName && <p style={{ fontSize: '18px', color: colours.neutral[600], marginBottom: spacing[2] }}>{companyName}</p>}
        {profile.tagline && <p style={{ fontSize: '20px', color: colours.neutral[700], fontStyle: 'italic', marginTop: spacing[3] }}>"{profile.tagline}"</p>}
        {profile.industry && <span style={{ display: 'inline-block', marginTop: spacing[3], padding: `${spacing[1]} ${spacing[3]}`, backgroundColor: colours.neutral[200], borderRadius: radii.full, fontSize: typography.fontSize.sm, color: colours.neutral[700] }}>{profile.industry}</span>}
      </div>

      {/* Mission */}
      {profile.mission_statement && (
        <Section title="Mission">
          <div style={{ padding: spacing[5], backgroundColor: colours.neutral[100], borderRadius: radii.lg }}>
            <p style={{ fontSize: '17px', lineHeight: 1.8, color: colours.neutral[800], fontStyle: 'italic' }}>{profile.mission_statement}</p>
          </div>
          {profile.target_audience && (
            <div style={{ marginTop: spacing[4] }}>
              <h4 style={subHeadStyle}>Target Audience</h4>
              <p style={bodyStyle}>{profile.target_audience}</p>
            </div>
          )}
          {profile.strategic_tasks && (
            <div style={{ marginTop: spacing[4] }}>
              <h4 style={subHeadStyle}>Strategic Objectives</h4>
              <p style={bodyStyle}>{profile.strategic_tasks}</p>
            </div>
          )}
        </Section>
      )}

      {/* Story */}
      {hasStory && (
        <Section title="Brand Story">
          {profile.founder_story && (
            <div style={{ marginBottom: spacing[5] }}>
              <h4 style={subHeadStyle}>Founder Story</h4>
              <p style={bodyStyle}>{profile.founder_story}</p>
            </div>
          )}
          {profile.brand_narrative && (
            <div>
              <h4 style={subHeadStyle}>Brand Narrative</h4>
              <p style={bodyStyle}>{profile.brand_narrative}</p>
            </div>
          )}
        </Section>
      )}

      {/* Values */}
      {brandValues.length > 0 && (
        <Section title="Brand Values">
          <div style={{ display: 'grid', gridTemplateColumns: brandValues.length > 2 ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr', gap: spacing[4] }}>
            {brandValues.map((val, i) => (
              <div key={i} style={{ padding: spacing[5], backgroundColor: colours.neutral[100], borderRadius: radii.lg, borderTop: `3px solid ${colours.neutral[900]}` }}>
                <h4 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colours.neutral[900], marginBottom: spacing[1] }}>{val.name}</h4>
                {val.tagline && <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[900], fontWeight: typography.fontWeight.medium, marginBottom: spacing[2] }}>{val.tagline}</p>}
                {val.narrative && <p style={{ fontSize: typography.fontSize.sm, lineHeight: 1.7, color: colours.neutral[700] }}>{val.narrative}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Metaphors */}
      {metaphors.length > 0 && (
        <Section title="Brand Metaphors">
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            {metaphors.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: spacing[4], alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: radii.full, backgroundColor: colours.neutral[200], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize.lg, color: colours.neutral[900], flexShrink: 0, fontWeight: typography.fontWeight.bold }}>{i + 1}</div>
                <div>
                  <h4 style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colours.neutral[900], marginBottom: spacing[1] }}>{m.name}</h4>
                  <p style={{ fontSize: typography.fontSize.sm, lineHeight: 1.7, color: colours.neutral[700] }}>{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Archetypes */}
      {archetypes.length > 0 && (
        <Section title="Brand Archetypes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing[4] }}>
            {archetypes.map((a, i) => (
              <div key={i} style={{ padding: spacing[4], backgroundColor: colours.neutral[100], borderRadius: radii.lg, border: `1px solid ${colours.neutral[200]}` }}>
                <h4 style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colours.neutral[900], marginBottom: spacing[2] }}>{a.name}</h4>
                <p style={{ fontSize: typography.fontSize.sm, lineHeight: 1.7, color: colours.neutral[700] }}>{a.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Messaging Pillars */}
      {messagingPillars.length > 0 && (
        <Section title="Messaging Pillars">
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
            {messagingPillars.map((pillar, i) => (
              <div key={i}>
                <h4 style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colours.neutral[900], marginBottom: spacing[3] }}>{pillar.pillar_name}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                  {(pillar.phrases || []).map((phrase, j) => (
                    <span key={j} style={{ padding: `${spacing[1]} ${spacing[3]}`, backgroundColor: colours.neutral[100], borderRadius: radii.full, fontSize: typography.fontSize.sm, color: colours.neutral[800], border: `1px solid ${colours.neutral[200]}` }}>
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Colours */}
      {hasColours && (
        <Section title="Colour Palette">
          {coloursPrimary.length > 0 && (
            <div style={{ marginBottom: spacing[6] }}>
              <h4 style={subHeadStyle}>Primary</h4>
              <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}>
                {coloursPrimary.map((c, i) => <ColourChip key={i} colour={c} />)}
              </div>
            </div>
          )}
          {coloursSecondary.length > 0 && (
            <div style={{ marginBottom: spacing[6] }}>
              <h4 style={subHeadStyle}>Secondary</h4>
              <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}>
                {coloursSecondary.map((c, i) => <ColourChip key={i} colour={c} />)}
              </div>
            </div>
          )}
          {brandColours.length > 0 && coloursPrimary.length === 0 && coloursSecondary.length === 0 && (
            <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}>
              {brandColours.map((c, i) => <ColourChip key={i} colour={c} />)}
            </div>
          )}
        </Section>
      )}

      {/* Typography */}
      {typo.length > 0 && (
        <Section title="Typography">
          <div style={{ overflow: 'hidden', borderRadius: radii.lg, border: `1px solid ${colours.neutral[200]}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colours.neutral[100] }}>
                  {['Role', 'Font Family', 'Weight', 'Tracking', 'Case'].map(h => (
                    <th key={h} style={{ padding: spacing[3], fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colours.neutral[600], textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {typo.map((t, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${colours.neutral[200]}` }}>
                    <td style={tdStyle}><strong>{t.role}</strong></td>
                    <td style={{ ...tdStyle, fontFamily: typography.fontFamily.mono }}>{t.font_family}</td>
                    <td style={tdStyle}>{t.weight}</td>
                    <td style={tdStyle}>{t.tracking}</td>
                    <td style={tdStyle}>{t.case_rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Imagery */}
      {(imagery.backgrounds?.length > 0 || imagery.notes || imagery.template_descriptions?.length > 0) && (
        <Section title="Imagery Guidelines">
          {imagery.backgrounds?.length > 0 && (
            <div style={{ marginBottom: spacing[4] }}>
              <h4 style={subHeadStyle}>Backgrounds</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                {imagery.backgrounds.map((bg, i) => (
                  <span key={i} style={{ padding: `${spacing[2]} ${spacing[3]}`, backgroundColor: colours.neutral[100], borderRadius: radii.md, fontSize: typography.fontSize.sm, color: colours.neutral[800], border: `1px solid ${colours.neutral[200]}` }}>{bg}</span>
                ))}
              </div>
            </div>
          )}
          {imagery.notes && (
            <div style={{ marginBottom: spacing[4] }}>
              <h4 style={subHeadStyle}>Notes</h4>
              <p style={bodyStyle}>{imagery.notes}</p>
            </div>
          )}
          {imagery.template_descriptions?.length > 0 && (
            <div>
              <h4 style={subHeadStyle}>Templates</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                {imagery.template_descriptions.map((desc, i) => (
                  <div key={i} style={{ padding: spacing[3], backgroundColor: colours.neutral[100], borderRadius: radii.md, fontSize: typography.fontSize.sm, lineHeight: 1.7, color: colours.neutral[700], border: `1px solid ${colours.neutral[200]}` }}>{desc}</div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Logo Variants */}
      {logos.length > 0 && (
        <Section title="Logo Variants">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: spacing[4] }}>
            {logos.map(logo => (
              <div key={logo.id} style={{ padding: spacing[4], backgroundColor: logo.background_type === 'dark' ? '#0a0a0a' : logo.background_type === 'light' ? '#ffffff' : colours.neutral[100], borderRadius: radii.lg, border: `1px solid ${colours.neutral[200]}`, textAlign: 'center' }}>
                <img src={logo.file_path} alt={logo.variant_name} style={{ maxWidth: '100%', height: 80, objectFit: 'contain', marginBottom: spacing[2] }} />
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: logo.background_type === 'dark' ? colours.neutral[900] : colours.neutral[900] }}>{logo.variant_name}</div>
                <div style={{ fontSize: typography.fontSize.xs, color: logo.background_type === 'dark' ? colours.neutral[500] : colours.neutral[500] }}>{logo.logo_type} / {logo.background_type}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Voice & Tone */}
      {profile.voice_tone && (
        <Section title="Voice & Tone">
          <p style={bodyStyle}>{profile.voice_tone}</p>
        </Section>
      )}

      {/* Guidelines (Do's / Don'ts) */}
      {hasGuidelines && (
        <Section title="Brand Guidelines">
          <div style={{ display: 'grid', gridTemplateColumns: profile.dos && profile.donts ? '1fr 1fr' : '1fr', gap: spacing[6] }}>
            {profile.dos && (
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: colours.neutral[700], marginBottom: spacing[3], display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ fontSize: '20px' }}>+</span> Do
                </h4>
                <p style={bodyStyle}>{profile.dos}</p>
              </div>
            )}
            {profile.donts && (
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: colours.neutral[700], marginBottom: spacing[3], display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ fontSize: '20px' }}>-</span> Don't
                </h4>
                <p style={bodyStyle}>{profile.donts}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Additional Notes */}
      {profile.additional_notes && (
        <Section title="Additional Notes">
          <p style={bodyStyle}>{profile.additional_notes}</p>
        </Section>
      )}

      {/* Brand Guide PDF */}
      {profile.brand_guide_path && (
        <Section title="Brand Guide Document">
          <a href={profile.brand_guide_path} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: spacing[2], padding: `${spacing[3]} ${spacing[4]}`, backgroundColor: colours.neutral[100], borderRadius: radii.lg, border: `1px solid ${colours.neutral[200]}`, color: colours.neutral[900], textDecoration: 'none', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
            View Full Brand Guide PDF
          </a>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: spacing[8] }}>
      <h3 style={{ fontSize: '20px', fontWeight: 700, color: colours.neutral[900], marginBottom: spacing[4], paddingBottom: spacing[3], borderBottom: `1px solid ${colours.neutral[200]}`, letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function ColourChip({ colour }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: radii.lg, backgroundColor: colour.hex || colours.neutral[500], border: `1px solid ${colours.neutral[300]}`, marginBottom: spacing[2] }} />
      <div style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>{colour.name}</div>
      <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], fontFamily: typography.fontFamily.mono }}>{colour.hex}</div>
      {colour.pantone && <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>{colour.pantone}</div>}
    </div>
  )
}

const subHeadStyle = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[600],
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: spacing[3],
}

const bodyStyle = {
  fontSize: '15px',
  lineHeight: 1.8,
  color: colours.neutral[700],
  whiteSpace: 'pre-wrap',
}

const tdStyle = {
  padding: spacing[3],
  fontSize: typography.fontSize.sm,
  color: colours.neutral[800],
}
