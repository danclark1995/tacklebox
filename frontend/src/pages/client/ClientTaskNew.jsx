import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Spinner from '@/components/ui/Spinner'
import TaskForm from '@/components/features/tasks/TaskForm'
import { createTask } from '@/services/tasks'
import { listCategories } from '@/services/categories'
import { listTemplates } from '@/services/templates'
import { listProjects } from '@/services/projects'
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
        const [projectsData, categoriesData, templatesData] = await Promise.all([
          listProjects(),
          listCategories(),
          listTemplates()
        ])
        setProjects(projectsData || [])
        setCategories(categoriesData || [])
        setTemplates(templatesData || [])
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
      const newTask = await createTask(taskData)
      addToast('Task submitted! We\'ll get started soon.', 'success')
      navigate(`/client/tasks/${newTask.id}`)
    } catch (err) {
      if (err.message?.includes('Insufficient credits')) {
        addToast('Not enough credits — visit the Credits page to purchase more.', 'error')
      } else {
        addToast(err.message, 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <Spinner size="lg" />
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
