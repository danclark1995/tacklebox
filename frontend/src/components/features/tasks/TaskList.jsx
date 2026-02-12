import { EmptyState, Skeleton } from '@/components/ui'
import TaskCard from './TaskCard'
import { TASK_STATUSES, TASK_STATUS_LABELS, PRIORITIES, PRIORITY_LABELS } from '@/config/constants'
import { colours, spacing } from '@/config/tokens'

/**
 * TaskList
 *
 * Filterable/sortable task list with filter bar.
 * Shows filter dropdowns for status, priority, category.
 * Renders TaskCards. Shows EmptyState when empty. Shows Skeleton when loading.
 */
export default function TaskList({
  tasks = [],
  loading = false,
  filters = {},
  onFilterChange,
  onTaskClick,
  emptyTitle = 'No tasks found',
  emptyDescription = 'There are no tasks to display.',
}) {
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.values(TASK_STATUSES).map(status => ({
      value: status,
      label: TASK_STATUS_LABELS[status],
    })),
  ]

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    ...Object.values(PRIORITIES).map(priority => ({
      value: priority,
      label: PRIORITY_LABELS[priority],
    })),
  ]

  const handleFilterChange = (filterName, value) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, [filterName]: value })
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        <Skeleton height={120} />
        <Skeleton height={120} />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </div>
    )
  }

  return (
    <div className="task-list">
      {/* Task List */}
      {tasks.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[4],
        }}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick && onTaskClick(task)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
