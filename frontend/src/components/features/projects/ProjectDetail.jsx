import { Button, ProgressBar, StatusBadge } from '@/components/ui'
import TaskList from '../tasks/TaskList'
import { colours, spacing } from '@/config/tokens'
import { formatDateTime } from '@/utils/formatters'

/**
 * ProjectDetail
 *
 * Project detail with task list.
 * Shows: project name, description, client, status, progress bar, then TaskList of tasks in this project.
 */
export default function ProjectDetail({
  project,
  tasks = [],
  loading = false,
  onTaskClick,
  onEditProject,
}) {
  if (!project) return null

  const completedCount = tasks.filter(t => t.status === 'closed').length
  const totalCount = tasks.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="project-detail">
      {/* Header */}
      <div style={{
        padding: spacing[6],
        backgroundColor: colours.white,
        borderRadius: '8px',
        marginBottom: spacing[6],
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing[4],
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 600,
              color: colours.neutral[900],
              marginBottom: spacing[2],
            }}>
              {project.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], flexWrap: 'wrap' }}>
              <StatusBadge status={project.status} />
              {project.client_name && (
                <span style={{
                  fontSize: '14px',
                  color: colours.neutral[600],
                }}>
                  Client: <span style={{ fontWeight: 500, color: colours.neutral[700] }}>
                    {project.client_name}
                  </span>
                </span>
              )}
              <span style={{
                fontSize: '14px',
                color: colours.neutral[500],
              }}>
                Created {formatDateTime(project.created_at)}
              </span>
            </div>
          </div>
          {onEditProject && (
            <Button variant="secondary" onClick={onEditProject}>
              Edit Project
            </Button>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: colours.neutral[700],
            marginBottom: spacing[5],
            whiteSpace: 'pre-wrap',
          }}>
            {project.description}
          </p>
        )}

        {/* Progress */}
        <div style={{
          padding: spacing[4],
          backgroundColor: colours.neutral[50],
          borderRadius: '8px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[3],
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: colours.neutral[700],
            }}>
              Project Progress
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: colours.primary[600],
            }}>
              {completedCount} of {totalCount} tasks complete
            </span>
          </div>
          <ProgressBar
            value={progressPercentage}
            max={100}
            variant={progressPercentage === 100 ? 'success' : 'primary'}
          />
          <div style={{
            marginTop: spacing[2],
            fontSize: '13px',
            color: colours.neutral[500],
            textAlign: 'right',
          }}>
            {progressPercentage}% complete
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: colours.neutral[900],
          marginBottom: spacing[4],
        }}>
          Tasks
        </h2>
        <TaskList
          tasks={tasks}
          loading={loading}
          onTaskClick={onTaskClick}
          emptyTitle="No tasks in this project"
          emptyDescription="Tasks created for this project will appear here."
        />
      </div>
    </div>
  )
}
