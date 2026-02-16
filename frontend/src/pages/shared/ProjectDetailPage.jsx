import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, FolderOpen, Clock, DollarSign, AlertTriangle, Plus, Edit3 } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { PageHeader, Button, GlowCard, Modal, Spinner, EmptyState, WaveProgressBar, Badge, StatusBadge, Tabs } from '@/components/ui'
import TaskCard from '@/components/features/tasks/TaskCard'
import ProjectForm from '@/components/features/projects/ProjectForm'
import { getProject, updateProject, getProjectTasks } from '@/services/projects'
import { listUsers } from '@/services/users'
import { colours, spacing, typography, radii } from '@/config/tokens'
import { TASK_STATUSES } from '@/config/constants'

const TASK_TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()
  const { addToast } = useToast()
  const isAdmin = hasRole('admin')
  const isClient = hasRole('client')
  const isCamper = hasRole('contractor')

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [taskTab, setTaskTab] = useState('all')

  const basePath = isAdmin ? '/admin' : isClient ? '/client' : '/camper'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [proj, taskData] = await Promise.all([
        getProject(id),
        getProjectTasks(id),
      ])
      setProject(proj)
      setTasks(taskData || [])
      if (isAdmin) {
        const users = await listUsers({ role: 'client' })
        setClients(users || [])
      }
    } catch (err) {
      console.error('Project fetch error:', err)
      addToast('Failed to load project', 'error')
    } finally {
      setLoading(false)
    }
  }, [id, isAdmin])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdate = async (formData) => {
    setSaving(true)
    try {
      const updated = await updateProject(id, formData)
      setProject(prev => ({ ...prev, ...updated }))
      addToast('Project updated', 'success')
      setShowEdit(false)
    } catch (err) {
      addToast(err.message || 'Failed to update project', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTaskClick = (task) => {
    navigate(`${basePath}/tasks/${task.id}`)
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}><Spinner size="lg" /></div>
  if (!project) return <EmptyState icon={<FolderOpen size={32} />} title="Project not found" description="This project may have been deleted or you don't have access." />

  const completed = tasks.filter(t => ['closed', 'approved'].includes(t.status)).length
  const inProgress = tasks.filter(t => ['assigned', 'in_progress', 'review', 'revision'].includes(t.status)).length
  const submitted = tasks.filter(t => t.status === 'submitted').length
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
  const totalPayout = tasks.reduce((sum, t) => sum + (t.total_payout || 0), 0)
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  const filteredTasks = taskTab === 'all' ? tasks
    : taskTab === 'active' ? tasks.filter(t => !['closed', 'approved', 'cancelled'].includes(t.status))
    : tasks.filter(t => ['closed', 'approved'].includes(t.status))

  const nextDeadline = tasks
    .filter(t => t.deadline && !['closed', 'cancelled'].includes(t.status))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0]

  return (
    <div style={{ padding: spacing[6], maxWidth: 1200, margin: '0 auto' }}>
      {/* Back link */}
      <Button
        variant="ghost" size="sm"
        onClick={() => navigate(`${basePath}/projects`)}
        style={{ marginBottom: spacing[4] }}
      >
        <ChevronLeft size={16} /> Back to Projects
      </Button>

      {/* Project Header */}
      <GlowCard style={{ marginBottom: spacing[4] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[3] }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] }}>
              <h1 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>
                {project.name}
              </h1>
              <Badge variant={project.status === 'active' ? 'success' : project.status === 'completed' ? 'primary' : 'secondary'}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
            <div style={{ display: 'flex', gap: spacing[4], flexWrap: 'wrap', fontSize: typography.fontSize.sm, color: colours.neutral[500] }}>
              {project.client_name && !isClient && <span>Client: {project.client_name}</span>}
              {project.deadline && (
                <span style={{ color: new Date(project.deadline) < new Date(Date.now() + 7 * 86400000) ? colours.neutral[700] : colours.neutral[500] }}>
                  Deadline: {new Date(project.deadline).toLocaleDateString('en-NZ', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span>Created {new Date(project.created_at).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: spacing[2] }}>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                <Edit3 size={14} /> Edit
              </Button>
            )}
            {(isAdmin || isClient) && (
              <Button variant="primary" size="sm" onClick={() => navigate(`${basePath}/tasks/new?project=${id}`)}>
                <Plus size={14} /> Add Task
              </Button>
            )}
          </div>
        </div>

        {project.description && (
          <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600], lineHeight: 1.6, marginBottom: spacing[4], whiteSpace: 'pre-wrap' }}>
            {project.description}
          </p>
        )}

        {/* Project Brief */}
        {project.brief && (
          <div style={{ marginBottom: spacing[4], padding: spacing[4], backgroundColor: colours.neutral[100], borderRadius: radii.md, borderLeft: `3px solid ${colours.brand?.primary || colours.neutral[500]}` }}>
            <div style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colours.neutral[500], marginBottom: spacing[2], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Project Brief
            </div>
            <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[700], lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {project.brief}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: spacing[3], marginBottom: spacing[4] }}>
          <div style={{ padding: spacing[3], backgroundColor: colours.neutral[100], borderRadius: radii.md, textAlign: 'center' }}>
            <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>{tasks.length}</div>
            <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>Total Tasks</div>
          </div>
          <div style={{ padding: spacing[3], backgroundColor: colours.neutral[100], borderRadius: radii.md, textAlign: 'center' }}>
            <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>{inProgress}</div>
            <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>In Progress</div>
          </div>
          <div style={{ padding: spacing[3], backgroundColor: colours.neutral[100], borderRadius: radii.md, textAlign: 'center' }}>
            <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>{completed}</div>
            <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>Completed</div>
          </div>
          {totalHours > 0 && (
            <div style={{ padding: spacing[3], backgroundColor: colours.neutral[100], borderRadius: radii.md, textAlign: 'center' }}>
              <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>{totalHours}h</div>
              <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>Est. Hours</div>
            </div>
          )}
          {totalPayout > 0 && !isClient && (
            <div style={{ padding: spacing[3], backgroundColor: colours.neutral[100], borderRadius: radii.md, textAlign: 'center' }}>
              <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>${totalPayout.toFixed(0)}</div>
              <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>Total Value</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
            <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[600] }}>Overall Progress</span>
            <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>{progress}%</span>
          </div>
          <WaveProgressBar progress={progress} size="sm" />
        </div>

        {/* Deadline warning */}
        {nextDeadline && new Date(nextDeadline.deadline) < new Date(Date.now() + 7 * 86400000) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: spacing[3], padding: `${spacing[2]} ${spacing[3]}`, backgroundColor: colours.neutral[100], borderRadius: radii.md }}>
            <AlertTriangle size={14} style={{ color: colours.neutral[700] }} />
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[700] }}>
              Next deadline: <strong>{nextDeadline.title}</strong> — {new Date(nextDeadline.deadline).toLocaleDateString('en-NZ', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
      </GlowCard>

      {/* Tasks Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
        <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>Tasks</h2>
      </div>

      <div style={{ marginBottom: spacing[4] }}>
        <Tabs tabs={TASK_TABS} activeTab={taskTab} onChange={setTaskTab} />
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={32} />}
          title={taskTab === 'all' ? 'No tasks in this project' : `No ${taskTab} tasks`}
          description={taskTab === 'all' ? 'Add tasks to this project to track progress.' : 'Tasks matching this filter will appear here.'}
          action={(isAdmin || isClient) && taskTab === 'all' ? (
            <Button variant="primary" onClick={() => navigate(`${basePath}/tasks/new?project=${id}`)}>Add Task</Button>
          ) : null}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: spacing[4] }}>
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Project" size="md">
        <ProjectForm
          onSubmit={handleUpdate}
          clients={clients}
          initialData={project}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
