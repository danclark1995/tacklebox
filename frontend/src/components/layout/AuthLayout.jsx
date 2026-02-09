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

  const logoImgStyle = {
    height: '48px',
    width: 'auto',
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
          <img src="/tacklebox_logo.png" alt="TackleBox" style={logoImgStyle} />
          <div style={taglineStyle}>Creative project management</div>
        </div>
        {children}
      </div>
    </div>
  )
}
