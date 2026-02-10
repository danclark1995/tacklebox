import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import EmberLoader from '@/components/ui/EmberLoader'
import EmptyState from '@/components/ui/EmptyState'
import TaskProgressTracker from '@/components/ui/TaskProgressTracker'
import ProjectList from '@/components/features/projects/ProjectList'
import TaskList from '@/components/features/tasks/TaskList'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography } from '@/config/tokens'

export default function ClientDashboard() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [taskFilter, setTaskFilter] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          fetch(apiEndpoint('/tasks'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/projects'), { headers: { ...getAuthHeaders() } })
        ])

        const tasksJson = await tasksRes.json()
        const projectsJson = await projectsRes.json()

        if (tasksJson.success) setTasks(tasksJson.data)
        if (projectsJson.success) setProjects(projectsJson.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  const activeTasks = tasks.filter(t => ['submitted', 'assigned', 'in_progress'].includes(t.status))
  const awaitingFeedback = tasks.filter(t => t.status === 'review')
  const recentlyCompleted = tasks.filter(t => ['approved', 'closed'].includes(t.status)).slice(0, 5)

  const filteredTasks = taskFilter === 'active' ? activeTasks :
                        taskFilter === 'feedback' ? awaitingFeedback :
                        taskFilter === 'completed' ? recentlyCompleted :
                        tasks.slice(0, 10)

  const headerStyle = {
    marginBottom: spacing[6],
  }

  const titleStyle = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
    marginBottom: spacing[2],
  }

  const subtitleStyle = {
    fontSize: typography.fontSize.base,
    color: colours.neutral[600],
  }

  const summaryGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[8],
  }

  const summaryCardStyle = (isActive) => ({
    padding: spacing[5],
    cursor: 'pointer',
    border: isActive ? `2px solid ${colours.neutral[900]}` : 'none',
    transition: 'all 0.2s ease',
  })

  const summaryLabelStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[600],
    marginBottom: spacing[2],
  }

  const summaryValueStyle = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
  }

  const sectionStyle = {
    marginBottom: spacing[8],
  }

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  }

  const sectionTitleStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
  }

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Welcome back, {user?.display_name || user?.name}</h1>
        {user?.company && <p style={subtitleStyle}>{user.company}</p>}
      </div>

      <div style={summaryGridStyle}>
        <GlowCard
          style={summaryCardStyle(taskFilter === 'active')}
          onClick={() => setTaskFilter(taskFilter === 'active' ? null : 'active')}
        >
          <div style={summaryLabelStyle}>Active Tasks</div>
          <div style={summaryValueStyle}>{activeTasks.length}</div>
        </GlowCard>

        <GlowCard
          style={summaryCardStyle(taskFilter === 'feedback')}
          onClick={() => setTaskFilter(taskFilter === 'feedback' ? null : 'feedback')}
        >
          <div style={summaryLabelStyle}>Awaiting Feedback</div>
          <div style={summaryValueStyle}>{awaitingFeedback.length}</div>
        </GlowCard>

        <GlowCard
          style={summaryCardStyle(taskFilter === 'completed')}
          onClick={() => setTaskFilter(taskFilter === 'completed' ? null : 'completed')}
        >
          <div style={summaryLabelStyle}>Recently Completed</div>
          <div style={summaryValueStyle}>{recentlyCompleted.length}</div>
        </GlowCard>
      </div>

      {/* Task Progress Trackers */}
      {activeTasks.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Task Progress</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {activeTasks.slice(0, 3).map(task => (
              <GlowCard key={task.id} padding="12px" onClick={() => navigate(`/client/tasks/${task.id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[2] }}>
                  {task.title}
                </div>
                <TaskProgressTracker status={task.status} />
              </GlowCard>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>My Projects</h2>
          </div>
          <ProjectList
            projects={projects}
            onProjectClick={(project) => navigate(`/projects/${project.id}`)}
          />
        </div>
      )}

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>
            {taskFilter === 'active' ? 'Active Tasks' :
             taskFilter === 'feedback' ? 'Awaiting Feedback' :
             taskFilter === 'completed' ? 'Recently Completed' :
             'Recent Tasks'}
          </h2>
          <Button onClick={() => navigate('/client/tasks/new')}>New Task</Button>
        </div>

        {filteredTasks.length > 0 ? (
          <TaskList
            tasks={filteredTasks}
            onTaskClick={(task) => navigate(`/client/tasks/${task.id}`)}
          />
        ) : (
          <EmptyState
            title="No tasks yet"
            message="Submit your first task to get started."
            action={{
              label: 'Create Task',
              onClick: () => navigate('/client/tasks/new')
            }}
          />
        )}
      </div>
    </div>
  )
}
