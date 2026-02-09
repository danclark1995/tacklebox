import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { colours, spacing, typography, radii, shadows, transitions } from '@/config/tokens'

const contentTypes = [
  {
    key: 'social',
    title: 'Social Media',
    description: 'Generate branded social media images for Instagram, LinkedIn, Facebook, and Twitter.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    key: 'document',
    title: 'Document',
    description: 'Create branded proposals, briefs, one-pagers, letterheads, and report covers.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: 'presentation',
    title: 'Presentation',
    description: 'Build branded slideshows with AI-generated content and your brand styling.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    key: 'ad',
    title: 'Ad Creative',
    description: 'Design ad creatives with AI-generated backgrounds and branded text overlays.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

export default function CreateHub() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const containerStyle = {
    padding: spacing[6],
    maxWidth: '900px',
    margin: '0 auto',
  }

  const headerStyle = {
    marginBottom: spacing[8],
  }

  const titleStyle = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
    marginBottom: spacing[2],
  }

  const subtitleStyle = {
    fontSize: typography.fontSize.base,
    color: colours.neutral[500],
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: spacing[4],
  }

  const cardStyle = {
    backgroundColor: colours.surface,
    border: `1px solid ${colours.neutral[200]}`,
    borderRadius: radii.xl,
    padding: spacing[6],
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  }

  const cardHoverStyle = {
    ...cardStyle,
    borderColor: colours.neutral[400],
    boxShadow: shadows.md,
  }

  const iconWrapperStyle = {
    width: '56px',
    height: '56px',
    borderRadius: radii.lg,
    backgroundColor: colours.neutral[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colours.neutral[600],
    marginBottom: spacing[4],
  }

  const cardTitleStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    marginBottom: spacing[2],
  }

  const cardDescStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[500],
    lineHeight: typography.lineHeight.relaxed,
  }

  const historyLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[8],
    padding: `${spacing[3]} ${spacing[5]}`,
    backgroundColor: colours.neutral[100],
    border: `1px solid ${colours.neutral[200]}`,
    borderRadius: radii.lg,
    color: colours.neutral[600],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: `all ${transitions.fast}`,
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Create Content</h1>
        <p style={subtitleStyle}>
          Generate on-brand content powered by AI. Choose a content type to get started.
        </p>
      </div>

      <div style={gridStyle}>
        {contentTypes.map(ct => (
          <Card
            key={ct.key}
            ct={ct}
            onClick={() => navigate(`/admin/tools/${ct.key}`)}
            cardStyle={cardStyle}
            cardHoverStyle={cardHoverStyle}
            iconWrapperStyle={iconWrapperStyle}
            cardTitleStyle={cardTitleStyle}
            cardDescStyle={cardDescStyle}
          />
        ))}
      </div>

      <div
        style={historyLinkStyle}
        onClick={() => navigate('/admin/tools')}
        onMouseEnter={e => { e.currentTarget.style.borderColor = colours.neutral[400] }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = colours.neutral[200] }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        View My Creations
      </div>
    </div>
  )
}

function Card({ ct, onClick, cardStyle, cardHoverStyle, iconWrapperStyle, cardTitleStyle, cardDescStyle }) {
  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={e => {
        Object.assign(e.currentTarget.style, { borderColor: colours.neutral[400], boxShadow: shadows.md })
      }}
      onMouseLeave={e => {
        Object.assign(e.currentTarget.style, { borderColor: colours.neutral[200], boxShadow: 'none' })
      }}
    >
      <div style={iconWrapperStyle}>{ct.icon}</div>
      <div style={cardTitleStyle}>{ct.title}</div>
      <div style={cardDescStyle}>{ct.description}</div>
    </div>
  )
}
