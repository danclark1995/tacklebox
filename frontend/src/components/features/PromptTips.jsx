import { useState, useRef, useEffect } from 'react'
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

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const data = TIPS[contentType]
  if (!data) return null

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: '6px' }}>
      <Info
        size={14}
        color="#666"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(v => !v)}
      />
      {open && (
        <div style={popoverStyle}>
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
        </div>
      )}
    </span>
  )
}

const popoverStyle = {
  position: 'absolute',
  top: '24px',
  left: '-8px',
  zIndex: 100,
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '16px',
  maxWidth: '360px',
  minWidth: '280px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

const exampleBlockStyle = {
  marginTop: '12px',
  padding: '10px',
  backgroundColor: '#111',
  borderRadius: '6px',
  border: '1px solid #222',
}
