import { useState } from 'react'
import { Select, EmptyState, Skeleton } from '@/components/ui'
import ProjectCard from './ProjectCard'
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/config/constants'
import { colours, spacing } from '@/config/tokens'

/**
 * ProjectList
 *
 * List of project cards with filters.
 * Optional filter by status. Grid layout (2-3 columns).
 */
export default function ProjectList({
  projects = [],
  loading = false,
  onProjectClick,
  emptyTitle = 'No projects found',
  emptyDescription = 'There are no projects to display.',
}) {
  const [statusFilter, setStatusFilter] = useState('')

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.values(PROJECT_STATUSES).map(status => ({
      value: status,
      label: PROJECT_STATUS_LABELS[status],
    })),
  ]

  const filteredProjects = statusFilter
    ? projects.filter(p => p.status === statusFilter)
    : projects

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: spacing[5],
      }}>
        <Skeleton height={200} />
        <Skeleton height={200} />
        <Skeleton height={200} />
      </div>
    )
  }

  return (
    <div className="project-list">
      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[6],
        padding: spacing[4],
        backgroundColor: colours.neutral[50],
        borderRadius: '8px',
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
        }}>
          {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </div>
        <div style={{ width: '200px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: spacing[5],
        }}>
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onProjectClick && onProjectClick(project)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
