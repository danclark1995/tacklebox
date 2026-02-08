import { colours, spacing, typography, radii, shadows } from '@/config/tokens'

export default function AuthLayout({ children }) {
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${colours.primary[500]} 0%, ${colours.primary[700]} 100%)`,
    padding: spacing[4],
  }

  const cardStyle = {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: colours.surface,
    borderRadius: radii.xl,
    boxShadow: shadows.xl,
    padding: spacing[8],
  }

  const logoContainerStyle = {
    textAlign: 'center',
    marginBottom: spacing[8],
  }

  const logoStyle = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.primary[500],
    marginBottom: spacing[2],
  }

  const taglineStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[600],
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoContainerStyle}>
          <div style={logoStyle}>TackleBox</div>
          <div style={taglineStyle}>Creative project management</div>
        </div>
        {children}
      </div>
    </div>
  )
}
