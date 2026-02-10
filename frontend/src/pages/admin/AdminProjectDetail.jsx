import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import EmberLoader from '@/components/ui/EmberLoader'
import ProjectDetail from '@/components/features/projects/ProjectDetail'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function AdminProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [projectRes, tasksRes] = await Promise.all([
          fetch(apiEndpoint(`/projects/${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/projects/${id}/tasks`), { headers: { ...getAuthHeaders() } })
        ])

        const projectJson = await projectRes.json()
        const tasksJson = await tasksRes.json()

        if (projectJson.success) setProject(projectJson.data)
        if (tasksJson.success) setTasks(tasksJson.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, addToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: spacing[8] }}>
        <p style={{ color: colours.neutral[600] }}>Project not found</p>
      </div>
    )
  }

  const backLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    color: colours.neutral[900],
    textDecoration: 'none',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[4],
  }

  return (
    <div>
      <Link to="/projects" style={backLinkStyle}>
        ← Back to Projects
      </Link>
      <ProjectDetail
        project={project}
        tasks={tasks}
        onTaskClick={(task) => navigate(`/admin/tasks/${task.id}`)}
        userRole="admin"
      />
    </div>
  )
}
