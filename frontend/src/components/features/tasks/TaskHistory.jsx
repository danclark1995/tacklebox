import { StatusBadge } from '@/components/ui'
import { TASK_STATUS_LABELS } from '@/config/constants'
import { formatDateTime } from '@/utils/formatters'
import { colours, spacing } from '@/config/tokens'

/**
 * TaskHistory
 *
 * Timeline display of task history entries.
 * Vertical timeline with dots, status badges for from→to, user name, date, and optional note.
 */
export default function TaskHistory({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: spacing[8], color: colours.neutral[500] }}>
        <p>No history available</p>
      </div>
    )
  }

  return (
    <div className="task-history" style={{ position: 'relative' }}>
      {/* Timeline line */}
      <div
        style={{
          position: 'absolute',
          left: '11px',
          top: '24px',
          bottom: '24px',
          width: '2px',
          backgroundColor: colours.neutral[200],
        }}
      />

      {/* History entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
        {history.map((entry, index) => (
          <div
            key={entry.id}
            style={{
              position: 'relative',
              paddingLeft: spacing[8],
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[2],
            }}
          >
            {/* Timeline dot */}
            <div
              style={{
                position: 'absolute',
                left: '0',
                top: '4px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: colours.white,
                border: `3px solid ${colours.primary[500]}`,
                boxShadow: '0 0 0 4px rgba(15, 113, 115, 0.1)',
                zIndex: 1,
              }}
            />

            {/* Entry content */}
            <div style={{
              padding: spacing[4],
              backgroundColor: colours.white,
              border: `1px solid ${colours.neutral[200]}`,
              borderRadius: '8px',
            }}>
              {/* Status transition */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                marginBottom: spacing[2],
                flexWrap: 'wrap',
              }}>
                <StatusBadge status={entry.from_status} />
                <span style={{
                  fontSize: '14px',
                  color: colours.neutral[500],
                  fontWeight: 500,
                }}>
                  →
                </span>
                <StatusBadge status={entry.to_status} />
              </div>

              {/* User and date */}
              <div style={{
                fontSize: '14px',
                color: colours.neutral[700],
                marginBottom: spacing[2],
              }}>
                <span style={{ fontWeight: 500 }}>{entry.changed_by_name}</span>
                {' '}
                changed status to{' '}
                <span style={{ fontWeight: 500 }}>
                  {TASK_STATUS_LABELS[entry.to_status]}
                </span>
              </div>

              <div style={{
                fontSize: '12px',
                color: colours.neutral[500],
              }}>
                {formatDateTime(entry.created_at)}
              </div>

              {/* Optional note */}
              {entry.note && (
                <div style={{
                  marginTop: spacing[3],
                  paddingTop: spacing[3],
                  borderTop: `1px solid ${colours.neutral[100]}`,
                  fontSize: '14px',
                  color: colours.neutral[700],
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}>
                  "{entry.note}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
