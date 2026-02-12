import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import EmberLoader from '@/components/ui/EmberLoader'
import TaskForm from '@/components/features/tasks/TaskForm'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function ClientTaskNew() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, categoriesRes, templatesRes] = await Promise.all([
          fetch(apiEndpoint('/projects'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/categories'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/templates'), { headers: { ...getAuthHeaders() } })
        ])

        const projectsJson = await projectsRes.json()
        const categoriesJson = await categoriesRes.json()
        const templatesJson = await templatesRes.json()

        if (projectsJson.success) setProjects(projectsJson.data)
        if (categoriesJson.success) setCategories(categoriesJson.data)
        if (templatesJson.success) setTemplates(templatesJson.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  const handleSubmit = async (taskData) => {
    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint('/tasks'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      })

      const json = await res.json()

      if (json.success) {
        addToast('Task submitted! We\'ll get started soon.', 'success')
        navigate(`/client/tasks/${json.data.id}`)
      } else {
        addToast(json.message || 'Failed to create task', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
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
      <Link to="/client/tasks" style={backLinkStyle}>
        ← Back to Tasks
      </Link>
      <PageHeader title="Submit New Task" />
      <TaskForm
        projects={projects}
        categories={categories}
        templates={templates}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  )
}
