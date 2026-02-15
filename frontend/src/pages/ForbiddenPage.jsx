import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { colours, spacing, typography } from '@/config/tokens'

export default function ForbiddenPage() {
  const navigate = useNavigate()

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

  return (
    <div style={containerStyle}>
      <div style={errorCodeStyle}>403</div>
      <h1 style={headingStyle}>Access Denied</h1>
      <p style={messageStyle}>
        You don't have permission to view this page.
      </p>
      <Button variant="secondary" onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </div>
  )
}
