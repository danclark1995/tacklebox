import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmberLoader from '@/components/ui/EmberLoader'
import Select from '@/components/ui/Select'
import TaskList from '@/components/features/tasks/TaskList'
import TaskForm from '@/components/features/tasks/TaskForm'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing } from '@/config/tokens'

export default function AdminTasks() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [contractorFilter, setContractorFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, usersRes, projectsRes, categoriesRes, templatesRes] = await Promise.all([
        fetch(apiEndpoint('/tasks'), { headers: { ...getAuthHeaders() } }),
        fetch(apiEndpoint('/users'), { headers: { ...getAuthHeaders() } }),
        fetch(apiEndpoint('/projects'), { headers: { ...getAuthHeaders() } }),
        fetch(apiEndpoint('/categories'), { headers: { ...getAuthHeaders() } }),
        fetch(apiEndpoint('/templates'), { headers: { ...getAuthHeaders() } }),
      ])

      const tasksJson = await tasksRes.json()
      const usersJson = await usersRes.json()
      const projectsJson = await projectsRes.json()
      const categoriesJson = await categoriesRes.json()
      const templatesJson = await templatesRes.json()

      if (tasksJson.success) setTasks(tasksJson.data)
      if (usersJson.success) setUsers(usersJson.data)
      if (projectsJson.success) setProjects(projectsJson.data)
      if (categoriesJson.success) setCategories(categoriesJson.data)
      if (templatesJson.success) setTemplates(templatesJson.data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateTask = async (taskData) => {
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
        setShowCreateModal(false)
        setSelectedClientId('')
        loadData()
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

  const filteredTasks = tasks.filter(task => {
    if (statusFilter && task.status !== statusFilter) return false
    if (clientFilter && task.client_id !== clientFilter) return false
    if (contractorFilter && task.contractor_id !== contractorFilter) return false
    if (priorityFilter && task.priority !== priorityFilter) return false
    return true
  })

  const clients = users.filter(u => u.role === 'client')

  const filtersStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
  }

  return (
    <div>
      <PageHeader
        title="All Tasks"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>Create Task</Button>
        }
      />

      <div style={filtersStyle}>
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'review', label: 'Review' },
            { value: 'revision', label: 'Revision' },
            { value: 'approved', label: 'Approved' },
            { value: 'closed', label: 'Closed' }
          ]}
        />

        <Select
          label="Priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          options={[
            { value: '', label: 'All Priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
          ]}
        />

        <Select
          label="Client"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          options={[
            { value: '', label: 'All Clients' },
            ...users.filter(u => u.role === 'client').map(u => ({
              value: u.id,
              label: u.display_name || u.name
            }))
          ]}
        />

        <Select
          label="Camper"
          value={contractorFilter}
          onChange={(e) => setContractorFilter(e.target.value)}
          options={[
            { value: '', label: 'All Campers' },
            ...users.filter(u => u.role === 'contractor').map(u => ({
              value: u.id,
              label: u.display_name || u.name
            }))
          ]}
        />
      </div>

      <TaskList
        tasks={filteredTasks}
        onTaskClick={(task) => navigate(`/admin/tasks/${task.id}`)}
      />

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setSelectedClientId('') }}
          title="Create Task"
          size="xl"
        >
          <div style={{ marginBottom: spacing[4] }}>
            <Select
              label="Client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              options={clients.map(c => ({ value: c.id, label: `${c.display_name}${c.company ? ` (${c.company})` : ''}` }))}
              placeholder="Select client..."
            />
          </div>
          <TaskForm
            onSubmit={handleCreateTask}
            projects={projects}
            categories={categories}
            templates={templates}
            loading={submitting}
            isAdmin
          />
        </Modal>
      )}
    </div>
  )
}
