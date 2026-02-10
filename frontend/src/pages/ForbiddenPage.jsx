import { colours, spacing, typography } from '@/config/tokens'

export default function ForbiddenPage() {
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
    color: colours.neutral[700],
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
    color: colours.neutral[700],
    textDecoration: 'none',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    padding: `${spacing[3]} ${spacing[6]}`,
    borderRadius: '8px',
    border: `2px solid ${colours.neutral[700]}`,
    transition: 'all 200ms ease',
    display: 'inline-block',
  }

  const linkHoverStyle = `
    .forbidden-link:hover {
      background-color: ${colours.neutral[700]};
      color: ${colours.white};
    }
  `

  return (
    <div style={containerStyle}>
      <style>{linkHoverStyle}</style>
      <div style={errorCodeStyle}>403</div>
      <h1 style={headingStyle}>Access Denied</h1>
      <p style={messageStyle}>
        You don't have permission to view this page.
      </p>
      <a href="/" style={linkStyle} className="forbidden-link">
        Back to Dashboard
      </a>
    </div>
  )
}
