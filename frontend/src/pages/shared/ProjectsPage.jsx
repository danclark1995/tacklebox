import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, Clock, DollarSign, AlertTriangle } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { PageHeader, Button, GlowCard, Modal, Spinner, EmptyState, Tabs, WaveProgressBar, Badge } from '@/components/ui'
import ProjectForm from '@/components/features/projects/ProjectForm'
import { listProjects, createProject } from '@/services/projects'
import { listUsers } from '@/services/users'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
]

export default function ProjectsPage() {
  const { user, hasRole } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const isAdmin = hasRole('admin')
  const isClient = hasRole('client')
  const isCamper = hasRole('contractor')

  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const basePath = isAdmin ? '/admin' : isClient ? '/client' : '/camper'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listProjects()
      setProjects(data || [])
      if (isAdmin) {
        const users = await listUsers({ role: 'client' })
        setClients(users || [])
      }
    } catch (err) {
      console.error('Projects fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (formData) => {
    setCreating(true)
    try {
      const newProject = await createProject(formData)
      addToast('Project created', 'success')
      setShowCreate(false)
      setProjects(prev => [newProject, ...prev])
    } catch (err) {
      addToast(err.message || 'Failed to create project', 'error')
    } finally {
      setCreating(false)
    }
  }

  const filtered = activeTab === 'all' ? projects : projects.filter(p => p.status === activeTab)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}><Spinner size="lg" /></div>

  return (
    <div style={{ padding: spacing[6], maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
        <PageHeader title="Projects" subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`} />
        {!isCamper && (
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project
          </Button>
        )}
      </div>

      <div style={{ marginBottom: spacing[4] }}>
        <Tabs tabs={STATUS_TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={32} />}
          title={activeTab === 'all' ? 'No projects yet' : `No ${activeTab.replace('_', ' ')} projects`}
          description={isCamper ? 'Projects you have tasks in will appear here.' : 'Create your first project to group related tasks together.'}
          action={!isCamper ? <Button variant="primary" onClick={() => setShowCreate(true)}>Create Project</Button> : null}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: spacing[4] }}>
          {filtered.map(project => {
            const completed = project.completed_count || 0
            const total = project.task_count || 0
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0
            const hasDeadline = project.next_deadline && new Date(project.next_deadline) < new Date(Date.now() + 7 * 86400000)

            return (
              <GlowCard
                key={project.id}
                onClick={() => navigate(`${basePath}/projects/${project.id}`)}
                glowOnHover
                padding="0"
                style={{ cursor: 'pointer' }}
              >
                <div style={{ padding: spacing[5] }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[3] }}>
                    <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], lineHeight: 1.3, flex: 1, marginRight: spacing[2] }}>
                      {project.name}
                    </h3>
                    <Badge variant={project.status === 'active' ? 'success' : project.status === 'completed' ? 'primary' : 'secondary'}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Client */}
                  {project.client_name && !isClient && (
                    <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[2] }}>
                      {project.client_name}
                    </div>
                  )}

                  {/* Description */}
                  {project.description && (
                    <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600], lineHeight: 1.5, marginBottom: spacing[4], overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {project.description}
                    </p>
                  )}

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[3], flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                      <FolderOpen size={12} />
                      {total} task{total !== 1 ? 's' : ''}
                    </span>
                    {project.total_hours > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                        <Clock size={12} />
                        {project.total_hours}h
                      </span>
                    )}
                    {project.total_payout > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                        <DollarSign size={12} />
                        ${Number(project.total_payout).toFixed(0)}
                      </span>
                    )}
                    {hasDeadline && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: typography.fontSize.xs, color: colours.neutral[700] }}>
                        <AlertTriangle size={12} />
                        Due {new Date(project.next_deadline).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  <div style={{ borderTop: `1px solid ${colours.neutral[200]}`, paddingTop: spacing[3] }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
                      <span style={{ fontSize: '12px', color: colours.neutral[500] }}>Progress</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: colours.neutral[700] }}>
                        {completed}/{total} complete
                      </span>
                    </div>
                    <WaveProgressBar progress={progress} size="sm" />
                  </div>
                </div>
              </GlowCard>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project" size="md">
        <ProjectForm
          onSubmit={handleCreate}
          clients={clients}
          loading={creating}
        />
      </Modal>
    </div>
  )
}
