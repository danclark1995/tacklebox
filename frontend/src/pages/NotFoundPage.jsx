import { colours, spacing, typography } from '@/config/tokens'

export default function NotFoundPage() {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: colours.background,
    padding: spacing[6],
    textAlign: 'center',
  }

  const errorCodeStyle = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.primary[500],
    marginBottom: spacing[4],
  }

  const headingStyle = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
    marginBottom: spacing[3],
  }

  const messageStyle = {
    fontSize: typography.fontSize.lg,
    color: colours.neutral[600],
    marginBottom: spacing[6],
    maxWidth: '500px',
  }

  const linkStyle = {
    color: colours.primary[500],
    textDecoration: 'none',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    padding: `${spacing[3]} ${spacing[6]}`,
    borderRadius: '8px',
    border: `2px solid ${colours.primary[500]}`,
    transition: 'all 200ms ease',
    display: 'inline-block',
  }

  const linkHoverStyle = `
    a:hover {
      background-color: ${colours.primary[500]};
      color: ${colours.white};
    }
  `

  return (
    <div style={containerStyle}>
      <style>{linkHoverStyle}</style>
      <div style={errorCodeStyle}>404</div>
      <h1 style={headingStyle}>Page Not Found</h1>
      <p style={messageStyle}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a href="/" style={linkStyle}>
        Back to Dashboard
      </a>
    </div>
  )
}
