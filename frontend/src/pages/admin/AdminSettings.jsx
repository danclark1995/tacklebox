import { spacing, typography, colours } from '@/config/tokens'

export default function AdminSettings() {
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
      <h1 style={titleStyle}>Settings</h1>
      <div style={containerStyle}>
        <div>Platform settings and configuration coming soon.</div>
      </div>
    </div>
  )
}
