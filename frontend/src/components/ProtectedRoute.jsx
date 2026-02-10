import { Navigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import EmberLoader from '@/components/ui/EmberLoader'
import { colours, spacing, typography } from '@/config/tokens'

export default function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()

  if (isLoading) {
    const loadingContainerStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: colours.background,
    }

    return (
      <div style={loadingContainerStyle}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    const forbiddenContainerStyle = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: colours.background,
      padding: spacing[6],
      textAlign: 'center',
    }

    const headingStyle = {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      color: colours.neutral[900],
      marginBottom: spacing[4],
    }

    const messageStyle = {
      fontSize: typography.fontSize.lg,
      color: colours.neutral[600],
      marginBottom: spacing[6],
    }

    const linkStyle = {
      color: colours.neutral[900],
      textDecoration: 'none',
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
    }

    return (
      <div style={forbiddenContainerStyle}>
        <div style={headingStyle}>403 - Access Denied</div>
        <div style={messageStyle}>
          You don't have permission to access this page.
        </div>
        <a href="/" style={linkStyle}>Return to Dashboard</a>
      </div>
    )
  }

  return children
}
