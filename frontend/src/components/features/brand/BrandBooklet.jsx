import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, Copy, Check } from 'lucide-react'
import GlowCard from '@/components/ui/GlowCard'
import useToast from '@/hooks/useToast'
import { colours, spacing, typography, radii } from '@/config/tokens'

/**
 * BrandBooklet — Interactive page-turn brand guide viewer.
 *
 * Props:
 *   brandProfile  – full brand profile object
 *   clientName    – display name
 *   companyName   – company name
 *   logos         – logo variants array
 *   onClose       – close handler (if null, renders inline instead of overlay)
 *   inline        – if true, renders without dark overlay (embedded in page)
 */
export default function BrandBooklet({ brandProfile, clientName, companyName, logos = [], onClose, inline = false }) {
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(0) // -1 = back, 0 = none, 1 = forward
  const [animating, setAnimating] = useState(false)

  const pages = buildPages(brandProfile, clientName, companyName, logos)

  const goTo = useCallback((idx) => {
    if (animating || idx < 0 || idx >= pages.length || idx === currentPage) return
    setDirection(idx > currentPage ? 1 : -1)
    setAnimating(true)
    setTimeout(() => {
      setCurrentPage(idx)
      setAnimating(false)
    }, 300)
  }, [animating, currentPage, pages.length])

  const goNext = useCallback(() => goTo(currentPage + 1), [goTo, currentPage])
  const goPrev = useCallback(() => goTo(currentPage - 1), [goTo, currentPage])

  useEffect(() => {
    if (inline) return
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, onClose, inline])

  // Keyboard for inline mode too
  useEffect(() => {
    if (!inline) return
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, inline])

  if (!brandProfile || pages.length === 0) {
    return inline ? (
      <div style={{ textAlign: 'center', padding: spacing[10], color: colours.neutral[500] }}>
        No brand profile available
      </div>
    ) : null
  }

  const pageContent = pages[currentPage]

  const exitStyle = animating
    ? { opacity: 0, transform: direction === 1 ? 'translateX(-30px)' : 'translateX(30px)', transition: 'transform 300ms ease, opacity 200ms ease' }
    : { opacity: 1, transform: 'translateX(0)', transition: 'transform 300ms ease, opacity 200ms ease' }

  const bookInner = (
    <>
      {/* Book container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        height: inline ? 'auto' : '80vh',
        minHeight: inline ? '500px' : undefined,
        backgroundColor: '#111',
        border: '1px solid #1a1a1a',
        borderRadius: '4px',
        boxShadow: inline ? 'none' : '0 20px 80px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.02)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Close button (overlay mode only) */}
        {onClose && !inline && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: '#555',
              cursor: 'pointer',
              padding: '4px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        )}

        {/* Page content area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: inline ? '32px' : '48px',
          ...exitStyle,
        }}>
          {pageContent}
        </div>

        {/* Navigation footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderTop: '1px solid #1a1a1a',
          flexShrink: 0,
        }}>
          <button
            onClick={goPrev}
            disabled={currentPage === 0}
            style={{
              background: 'none',
              border: 'none',
              color: currentPage === 0 ? '#333' : '#888',
              cursor: currentPage === 0 ? 'default' : 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Page dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === currentPage ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: i === currentPage ? '#ffffff' : '#333',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 300ms ease',
                }}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            disabled={currentPage === pages.length - 1}
            style={{
              background: 'none',
              border: 'none',
              color: currentPage === pages.length - 1 ? '#333' : '#888',
              cursor: currentPage === pages.length - 1 ? 'default' : 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Side navigation arrows (overlay mode) */}
      {!inline && (
        <>
          <button
            onClick={goPrev}
            disabled={currentPage === 0}
            style={{
              position: 'absolute',
              left: 'calc(50% - 430px)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: currentPage === 0 ? '#222' : '#555',
              cursor: currentPage === 0 ? 'default' : 'pointer',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={goNext}
            disabled={currentPage === pages.length - 1}
            style={{
              position: 'absolute',
              right: 'calc(50% - 430px)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: currentPage === pages.length - 1 ? '#222' : '#555',
              cursor: currentPage === pages.length - 1 ? 'default' : 'pointer',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}
    </>
  )

  // Inline mode: no overlay
  if (inline) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {bookInner}
      </div>
    )
  }

  // Overlay mode
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {bookInner}
    </div>
  )
}

/* ─── Page Builder ────────────────────────────────────────── */

function buildPages(profile, clientName, companyName, logos) {
  if (!profile) return []

  const safeArr = (val) => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return [] } }
    return []
  }

  const pages = []

  // Page 1: Cover (always)
  pages.push(
    <CoverPage
      key="cover"
      clientName={clientName}
      companyName={companyName}
      tagline={profile.tagline}
      industry={profile.industry}
    />
  )

  // Page 2: Mission & Strategy
  if (profile.mission_statement || profile.target_audience || profile.strategic_tasks) {
    pages.push(
      <MissionPage
        key="mission"
        mission={profile.mission_statement}
        audience={profile.target_audience}
        objectives={profile.strategic_tasks}
      />
    )
  }

  // Page 3: Brand Story
  if (profile.founder_story || profile.brand_narrative) {
    pages.push(
      <StoryPage
        key="story"
        founderStory={profile.founder_story}
        narrative={profile.brand_narrative}
      />
    )
  }

  // Page 4: Brand Identity
  const archetypes = safeArr(profile.archetypes)
  const brandValues = safeArr(profile.brand_values)
  if (archetypes.length > 0 || brandValues.length > 0) {
    pages.push(
      <IdentityPage
        key="identity"
        archetypes={archetypes}
        brandValues={brandValues}
      />
    )
  }

  // Page 5: Messaging
  const messagingPillars = safeArr(profile.messaging_pillars)
  if (messagingPillars.length > 0) {
    pages.push(
      <MessagingPage
        key="messaging"
        pillars={messagingPillars}
      />
    )
  }

  // Page 6: Voice & Tone
  if (profile.voice_tone || profile.dos || profile.donts) {
    pages.push(
      <VoicePage
        key="voice"
        voiceTone={profile.voice_tone}
        dos={profile.dos}
        donts={profile.donts}
      />
    )
  }

  return pages
}

/* ─── CopyableText ────────────────────────────────────────── */

function CopyableText({ text, children }) {
  const { addToast } = useToast()
  const [copied, setCopied] = useState(false)

  if (!text) return children || null

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      addToast('Copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      addToast('Failed to copy', 'error')
    }
  }

  return (
    <div style={{ position: 'relative', group: 'copy' }} className="copyable-section">
      {children}
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          color: copied ? '#fff' : '#444',
          opacity: copied ? 0.8 : 0.3,
          transition: 'opacity 200ms ease, color 200ms ease',
        }}
        className="copy-btn"
        title="Copy to clipboard"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <style>{`
        .copyable-section:hover .copy-btn { opacity: 0.7 !important; }
        .copy-btn:hover { opacity: 1 !important; color: #fff !important; }
      `}</style>
    </div>
  )
}

/* ─── Shared Styles ───────────────────────────────────────── */

const headingStyle = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#ffffff',
  marginBottom: '24px',
  letterSpacing: '-0.01em',
}

const subHeadingStyle = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '12px',
  marginTop: '28px',
}

const bodyTextStyle = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: '#ccc',
  whiteSpace: 'pre-wrap',
}

/* ─── Page Components ─────────────────────────────────────── */

function CoverPage({ clientName, companyName, tagline, industry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      height: '100%',
      minHeight: '400px',
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <h1 style={{
        fontSize: '36px',
        fontWeight: 700,
        color: '#ffffff',
        marginBottom: '12px',
        letterSpacing: '-0.02em',
        position: 'relative',
      }}>
        {clientName || companyName || 'Brand Guide'}
      </h1>

      {tagline && (
        <p style={{
          fontSize: '18px',
          color: '#888',
          fontStyle: 'italic',
          marginBottom: '16px',
          maxWidth: '500px',
          lineHeight: 1.5,
        }}>
          "{tagline}"
        </p>
      )}

      {industry && (
        <span style={{
          display: 'inline-block',
          padding: '4px 16px',
          border: '1px solid #333',
          borderRadius: '20px',
          fontSize: '14px',
          color: '#888',
          marginBottom: '48px',
        }}>
          {industry}
        </span>
      )}

      <div style={{
        position: 'absolute',
        bottom: '48px',
        fontSize: '12px',
        color: '#444',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
      }}>
        Brand Guide
      </div>
    </div>
  )
}

function MissionPage({ mission, audience, objectives }) {
  return (
    <div>
      <h2 style={headingStyle}>Mission & Strategy</h2>

      {mission && (
        <CopyableText text={mission}>
          <div style={{
            padding: '20px 24px',
            borderLeft: '2px solid rgba(255,255,255,0.2)',
            marginBottom: '24px',
          }}>
            <p style={{ ...bodyTextStyle, fontSize: '17px', fontStyle: 'italic', color: '#ddd' }}>
              {mission}
            </p>
          </div>
        </CopyableText>
      )}

      {audience && (
        <>
          <div style={subHeadingStyle}>Target Audience</div>
          <CopyableText text={audience}>
            <p style={bodyTextStyle}>{audience}</p>
          </CopyableText>
        </>
      )}

      {objectives && (
        <>
          <div style={subHeadingStyle}>Strategic Objectives</div>
          <CopyableText text={objectives}>
            <p style={bodyTextStyle}>{objectives}</p>
          </CopyableText>
        </>
      )}
    </div>
  )
}

function StoryPage({ founderStory, narrative }) {
  return (
    <div>
      <h2 style={headingStyle}>Our Story</h2>

      {founderStory && (
        <CopyableText text={founderStory}>
          <div style={{ marginBottom: '28px' }}>
            <div style={{ ...subHeadingStyle, marginTop: 0 }}>Founder Story</div>
            <p style={bodyTextStyle}>{founderStory}</p>
          </div>
        </CopyableText>
      )}

      {narrative && (
        <CopyableText text={narrative}>
          <div>
            <div style={subHeadingStyle}>Brand Narrative</div>
            <p style={bodyTextStyle}>{narrative}</p>
          </div>
        </CopyableText>
      )}
    </div>
  )
}

function IdentityPage({ archetypes, brandValues }) {
  return (
    <div>
      <h2 style={headingStyle}>Brand Identity</h2>

      {archetypes.length > 0 && (
        <>
          <div style={{ ...subHeadingStyle, marginTop: 0 }}>Archetypes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {archetypes.map((a, i) => (
              <CopyableText key={i} text={`${a.name}: ${a.description || ''}`}>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#0d0d0d',
                  border: '1px solid #1a1a1a',
                  borderRadius: '4px',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{a.name}</div>
                  {a.description && <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#999', margin: 0 }}>{a.description}</p>}
                </div>
              </CopyableText>
            ))}
          </div>
        </>
      )}

      {brandValues.length > 0 && (
        <>
          <div style={subHeadingStyle}>Brand Values</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {brandValues.map((val, i) => (
              <CopyableText key={i} text={typeof val === 'string' ? val : `${val.name}${val.narrative ? ': ' + val.narrative : ''}`}>
                <div style={{
                  padding: '8px 16px',
                  border: '1px solid #222',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: '#ccc',
                }}>
                  {typeof val === 'string' ? val : val.name}
                </div>
              </CopyableText>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MessagingPage({ pillars }) {
  return (
    <div>
      <h2 style={headingStyle}>Messaging</h2>

      <div style={{ ...subHeadingStyle, marginTop: 0 }}>Messaging Pillars</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {pillars.map((pillar, i) => {
          const phrases = pillar.phrases || []
          const copyText = `${pillar.pillar_name}\n${phrases.join(', ')}`
          return (
            <CopyableText key={i} text={copyText}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>
                  {pillar.pillar_name}
                </div>
                {phrases.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {phrases.map((phrase, j) => (
                      <span key={j} style={{
                        padding: '4px 12px',
                        backgroundColor: '#0d0d0d',
                        border: '1px solid #222',
                        borderRadius: '20px',
                        fontSize: '13px',
                        color: '#aaa',
                      }}>
                        {phrase}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CopyableText>
          )
        })}
      </div>
    </div>
  )
}

function VoicePage({ voiceTone, dos, donts }) {
  return (
    <div>
      <h2 style={headingStyle}>Voice & Tone</h2>

      {voiceTone && (
        <CopyableText text={voiceTone}>
          <div style={{ marginBottom: '28px' }}>
            <p style={bodyTextStyle}>{voiceTone}</p>
          </div>
        </CopyableText>
      )}

      {(dos || donts) && (
        <div style={{ display: 'grid', gridTemplateColumns: dos && donts ? '1fr 1fr' : '1fr', gap: '24px', marginTop: '8px' }}>
          {dos && (
            <CopyableText text={dos}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#ccc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>+</span> Do
                </div>
                <p style={bodyTextStyle}>{dos}</p>
              </div>
            </CopyableText>
          )}
          {donts && (
            <CopyableText text={donts}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#ccc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>-</span> Don't
                </div>
                <p style={bodyTextStyle}>{donts}</p>
              </div>
            </CopyableText>
          )}
        </div>
      )}
    </div>
  )
}
