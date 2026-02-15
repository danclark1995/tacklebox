import { GlowCard, Badge, StatusBadge, Avatar, TaskProgressTracker } from '@/components/ui'
import { PRIORITIES, TASK_STATUS_LABELS } from '@/config/constants'
import { formatDate, getInitials } from '@/utils/formatters'
import { colours } from '@/config/tokens'
import useAuth from '@/hooks/useAuth'

/**
 * TaskCard
 *
 * Compact card for task lists.
 * Shows: title, status badge, priority badge, category name, deadline, assigned contractor.
 */
export default function TaskCard({ task, onClick }) {
  const { hasRole } = useAuth()
  const isClient = hasRole('client')

  if (!task) return null

  const priorityVariantMap = {
    [PRIORITIES.URGENT]: 'error',
    [PRIORITIES.HIGH]: 'warning',
    [PRIORITIES.MEDIUM]: 'info',
    [PRIORITIES.LOW]: 'neutral',
  }

  const priorityVariant = priorityVariantMap[task.priority] || 'neutral'

  return (
    <GlowCard
      className="task-card"
      onClick={onClick}
      glowOnHover
      padding="0"
      style={{
        cursor: 'pointer',
      }}
    >
      <div style={{ padding: '16px' }}>
        {/* Header: Status and Priority */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}>
          <StatusBadge status={task.status} />
          <Badge variant={priorityVariant}>
            {task.priority?.toUpperCase()}
          </Badge>
          {!isClient && task.complexity_level != null && (
            <span style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: `1px solid ${colours.neutral[300]}`,
              backgroundColor: colours.neutral[100],
              color: task.complexity_level === 0 ? colours.neutral[900] : colours.neutral[500],
              boxShadow: task.complexity_level === 0 ? '0 0 6px rgba(255,255,255,0.3)' : 'none',
              fontWeight: 600,
            }}>
              L{task.complexity_level}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: colours.neutral[900],
          marginBottom: '8px',
          lineHeight: 1.4,
        }}>
          {task.title}
        </h3>

        {/* Meta information */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '14px',
          color: colours.neutral[600],
        }}>
          {task.category_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: colours.neutral[900]
              }} />
              <span>{task.category_name}</span>
            </div>
          )}

          {task.project_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: colours.neutral[400]
              }} />
              <span>{task.project_name}</span>
            </div>
          )}

          {task.deadline && (() => {
            const isOverdue = new Date(task.deadline) < new Date() && !['closed', 'approved', 'cancelled'].includes(task.status)
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: isOverdue ? colours.status.danger : colours.neutral[700]
                }} />
                <span style={{ color: isOverdue ? colours.status.danger : undefined, fontWeight: isOverdue ? 600 : undefined }}>
                  {isOverdue
                    ? `Overdue: ${new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                    : `Due: ${formatDate(task.deadline)}`}
                </span>
              </div>
            )
          })()}
        </div>

        {/* Assigned person */}
        {task.contractor_name && (
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: `1px solid ${colours.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Avatar
              src={task.contractor_avatar_url}
              name={task.contractor_name}
              size="sm"
            />
            <span style={{
              fontSize: '13px',
              color: colours.neutral[700],
              fontWeight: 500,
            }}>
              {isClient ? `Assigned to: ${task.contractor_name}` : task.contractor_name}
            </span>
          </div>
        )}

        {/* Progress Tracker */}
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: `1px solid ${colours.neutral[200]}`,
          transform: 'scale(0.85)',
          transformOrigin: 'left center',
        }}>
          <TaskProgressTracker status={task.status} />
        </div>
      </div>
    </GlowCard>
  )
}
