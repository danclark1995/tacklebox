import { spacing, typography, colours } from '@/config/tokens'

export default function CamperJourney() {
  const containerStyle = {
    textAlign: 'center',
    padding: spacing[12],
    color: colours.neutral[500],
    fontSize: typography.fontSize.sm,
  }

  const titleStyle = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
    marginBottom: spacing[4],
  }

  return (
    <div>
      <h1 style={titleStyle}>Journey</h1>
      <div style={containerStyle}>
        <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[700], marginBottom: spacing[2] }}>
          Your Camper Journey
        </div>
        <div>Track your growth, achievements, and milestones. Coming soon.</div>
      </div>
    </div>
  )
}
