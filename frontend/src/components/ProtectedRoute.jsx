import { Navigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { getEffectiveLevel } from '@/config/permissions'
import EmberLoader from '@/components/ui/EmberLoader'
import { colours, spacing, typography } from '@/config/tokens'

export default function ProtectedRoute({ roles, minLevel, children }) {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: colours.background,
      }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Role-based access check (Phase 1 backward compat)
  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <AccessDenied />
  }

  // Level-based access check
  if (minLevel && user) {
    const userLevel = getEffectiveLevel(user)
    if (userLevel < minLevel) {
      return <AccessDenied />
    }
  }

  return children
}

function AccessDenied() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', backgroundColor: colours.background, padding: spacing[6], textAlign: 'center',
    }}>
      <div style={{
        fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold,
        color: colours.neutral[900], marginBottom: spacing[4],
      }}>
        403 - Access Denied
      </div>
      <div style={{
        fontSize: typography.fontSize.lg, color: colours.neutral[600], marginBottom: spacing[6],
      }}>
        You don't have permission to access this page.
      </div>
      <a href="/" style={{
        color: colours.neutral[900], textDecoration: 'none',
        fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium,
      }}>
        Return to Dashboard
      </a>
    </div>
  )
}
