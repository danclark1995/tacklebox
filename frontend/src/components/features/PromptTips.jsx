import { useState, useRef, useEffect, useCallback } from 'react'
import { Info, Lightbulb } from 'lucide-react'

const TIPS = {
  social_image: {
    tips: [
      'Describe the mood, colours, and composition you want',
      'Mention specific objects, people, or scenes',
      'Include brand elements like logos or colour schemes',
    ],
    example: 'A minimalist flat-lay of a coffee cup on a marble table with soft morning light, clean and modern aesthetic',
  },
  document: {
    tips: [
      'Specify the document purpose and target audience',
      'List the key sections or topics to cover',
      'Mention tone: formal, casual, technical, etc.',
    ],
    example: 'A professional project proposal for a website redesign, covering timeline, deliverables, and budget breakdown',
  },
  presentation: {
    tips: [
      'Define the core message or takeaway',
      'Specify audience level: executive, technical, general',
      'Mention any data points or stats to highlight',
    ],
    example: 'Q4 marketing performance review for the leadership team, highlighting campaign ROI and growth metrics',
  },
  ad_creative: {
    tips: [
      'Describe the product or service being advertised',
      'Specify the target audience and platform',
      'Include desired emotional response or action',
    ],
    example: 'Instagram story ad for a fitness app targeting young professionals, energetic and motivational feel',
  },
}

export default function PromptTips({ contentType }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const iconRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (!iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    setPos({
      top: rect.top - 8,
      left: rect.left - 8,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target) && !iconRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  const data = TIPS[contentType]
  if (!data) return null

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: '6px' }}>
      <span ref={iconRef}>
        <Info
          size={14}
          color="#666"
          style={{ cursor: 'pointer' }}
          onClick={() => setOpen(v => !v)}
        />
      </span>
      {open && (
        <div ref={ref} style={{ ...popoverStyle, top: pos.top, left: pos.left }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '10px' }}>Tips</div>
          {data.tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '12px', color: '#ccc' }}>
              <Lightbulb size={13} color="#666" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{tip}</span>
            </div>
          ))}
          <div style={exampleBlockStyle}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Example</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>{data.example}</div>
          </div>
          {/* Arrow pointing down */}
          <div style={arrowStyle} />
        </div>
      )}
    </span>
  )
}

const popoverStyle = {
  position: 'fixed',
  transform: 'translateY(-100%)',
  zIndex: 100,
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '16px',
  maxWidth: '360px',
  minWidth: '280px',
  maxHeight: '300px',
  overflowY: 'auto',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

const arrowStyle = {
  position: 'absolute',
  bottom: '-6px',
  left: '16px',
  width: 0,
  height: 0,
  borderLeft: '6px solid transparent',
  borderRight: '6px solid transparent',
  borderTop: '6px solid #1a1a1a',
}

const exampleBlockStyle = {
  marginTop: '12px',
  padding: '10px',
  backgroundColor: '#111',
  borderRadius: '6px',
  border: '1px solid #222',
}
