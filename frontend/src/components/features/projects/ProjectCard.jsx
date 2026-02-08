import { Card, StatusBadge, ProgressBar } from '@/components/ui'
import { PROJECT_STATUS_LABELS } from '@/config/constants'
import { colours, spacing } from '@/config/tokens'
import { truncate } from '@/utils/formatters'

/**
 * ProjectCard
 *
 * Project summary card.
 * Shows: name, client name, status badge, progress bar (completed/total tasks), task count.
 */
export default function ProjectCard({ project, onClick }) {
  if (!project) return null

  const completedCount = project.completed_count || 0
  const totalCount = project.task_count || 0
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <Card
      className="project-card"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'all 150ms ease',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 113, 115, 0.15)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ padding: spacing[5] }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing[3],
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: colours.neutral[900],
            lineHeight: 1.3,
            flex: 1,
          }}>
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>

        {/* Client name */}
        {project.client_name && (
          <div style={{
            fontSize: '14px',
            color: colours.neutral[600],
            marginBottom: spacing[4],
          }}>
            Client: <span style={{ fontWeight: 500, color: colours.neutral[700] }}>
              {project.client_name}
            </span>
          </div>
        )}

        {/* Description */}
        {project.description && (
          <p style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: colours.neutral[600],
            marginBottom: spacing[4],
          }}>
            {truncate(project.description, 120)}
          </p>
        )}

        {/* Progress section */}
        <div style={{
          paddingTop: spacing[4],
          borderTop: `1px solid ${colours.neutral[200]}`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[2],
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: colours.neutral[600],
            }}>
              Progress
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: colours.primary[600],
            }}>
              {completedCount} of {totalCount} tasks
            </span>
          </div>
          <ProgressBar
            value={progressPercentage}
            max={100}
            variant={progressPercentage === 100 ? 'success' : 'primary'}
          />
          <div style={{
            marginTop: spacing[2],
            fontSize: '12px',
            color: colours.neutral[500],
            textAlign: 'right',
          }}>
            {progressPercentage}% complete
          </div>
        </div>
      </div>
    </Card>
  )
}
