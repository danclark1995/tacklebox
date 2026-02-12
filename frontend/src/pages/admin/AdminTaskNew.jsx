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

export default function AdminTaskNew() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [templates, setTemplates] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, categoriesRes, templatesRes, usersRes] = await Promise.all([
          fetch(apiEndpoint('/projects'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/categories'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/templates'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/users'), { headers: { ...getAuthHeaders() } }),
        ])

        const projectsJson = await projectsRes.json()
        const categoriesJson = await categoriesRes.json()
        const templatesJson = await templatesRes.json()
        const usersJson = await usersRes.json()

        if (projectsJson.success) setProjects(projectsJson.data)
        if (categoriesJson.success) setCategories(categoriesJson.data)
        if (templatesJson.success) setTemplates(templatesJson.data)
        if (usersJson.success) setClients(usersJson.data.filter(u => u.role === 'client'))
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  const handleSubmit = async (taskData) => {
    if (!selectedClientId) {
      addToast('Please select a client', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint('/tasks'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          client_id: selectedClientId,
        }),
      })

      const json = await res.json()

      if (json.success) {
        addToast('Task created successfully', 'success')
        navigate('/admin/tasks')
      } else {
        addToast(json.error || 'Failed to create task', 'error')
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

  return (
    <div>
      <Link to="/admin/tasks" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing[2],
        color: colours.neutral[900],
        textDecoration: 'none',
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing[4],
      }}>
        &larr; Back to Tasks
      </Link>

      <PageHeader title="Create Task" />

      <div style={{ marginBottom: spacing[5] }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Client <span style={{ color: colours.neutral[700] }}>*</span>
        </label>
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        >
          <option value="">Select client...</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.display_name}{c.company ? ` (${c.company})` : ''}</option>
          ))}
        </select>
      </div>

      <TaskForm
        onSubmit={handleSubmit}
        projects={projects}
        categories={categories}
        templates={templates}
        loading={submitting}
        isAdmin
      />
    </div>
  )
}
