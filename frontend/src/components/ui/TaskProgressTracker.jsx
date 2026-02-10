import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'closed', label: 'Closed' },
]

export default function TaskProgressTracker({ status }) {
  const currentIndex = STEPS.findIndex(s => s.key === status)
  const isCancelled = status === 'cancelled'
  const isRevision = status === 'revision'

  // For revision, highlight up to review step
  const effectiveIndex = isRevision ? STEPS.findIndex(s => s.key === 'review') : currentIndex

  return (
    <div style={containerStyle}>
      {STEPS.map((step, index) => {
        const isCompleted = index < effectiveIndex
        const isCurrent = index === effectiveIndex
        const isUpcoming = index > effectiveIndex

        return (
          <div key={step.key} style={stepContainerStyle}>
            {/* Connector line (before dot, except first) */}
            {index > 0 && (
              <div style={{
                ...connectorStyle,
                backgroundColor: isCompleted || isCurrent
                  ? colours.neutral[900]
                  : colours.neutral[300],
              }} />
            )}

            {/* Step dot */}
            <div style={{
              ...dotStyle,
              backgroundColor: isCancelled
                ? colours.neutral[500]
                : isCompleted
                  ? colours.neutral[900]
                  : isCurrent
                    ? colours.neutral[900]
                    : colours.neutral[300],
              boxShadow: isCurrent
                ? `0 0 0 4px ${colours.neutral[200]}`
                : 'none',
            }}>
              {isCompleted && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={colours.neutral[50]} strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            {/* Label */}
            <div style={{
              ...labelStyle,
              color: isCurrent
                ? colours.neutral[900]
                : isCompleted
                  ? colours.neutral[700]
                  : colours.neutral[500],
              fontWeight: isCurrent
                ? typography.fontWeight.semibold
                : typography.fontWeight.normal,
            }}>
              {step.label}
            </div>
          </div>
        )
      })}

      {/* Revision indicator */}
      {isRevision && (
        <div style={revisionBadgeStyle}>
          Revision Requested
        </div>
      )}
    </div>
  )
}

const containerStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0',
  position: 'relative',
  padding: `${spacing[4]} 0`,
}

const stepContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
  position: 'relative',
}

const connectorStyle = {
  position: 'absolute',
  top: '10px',
  right: '50%',
  width: '100%',
  height: '2px',
  zIndex: 0,
}

const dotStyle = {
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
  transition: `all ${transitions.normal}`,
  flexShrink: 0,
}

const labelStyle = {
  marginTop: spacing[2],
  fontSize: typography.fontSize.xs,
  textAlign: 'center',
  whiteSpace: 'nowrap',
}

const revisionBadgeStyle = {
  position: 'absolute',
  bottom: `-${spacing[2]}`,
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colours.neutral[700],
  whiteSpace: 'nowrap',
}
