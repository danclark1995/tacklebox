import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import EmberLoader from '@/components/ui/EmberLoader'
import Select from '@/components/ui/Select'
import TaskList from '@/components/features/tasks/TaskList'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing } from '@/config/tokens'

export default function AdminTasks() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [contractorFilter, setContractorFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [tasksRes, usersRes] = await Promise.all([
          fetch(apiEndpoint('/tasks'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/users'), { headers: { ...getAuthHeaders() } })
        ])

        const tasksJson = await tasksRes.json()
        const usersJson = await usersRes.json()

        if (tasksJson.success) setTasks(tasksJson.data)
        if (usersJson.success) setUsers(usersJson.data)
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

  const filteredTasks = tasks.filter(task => {
    if (statusFilter && task.status !== statusFilter) return false
    if (clientFilter && task.client_id !== clientFilter) return false
    if (contractorFilter && task.contractor_id !== contractorFilter) return false
    if (priorityFilter && task.priority !== priorityFilter) return false
    return true
  })

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
          <Button onClick={() => navigate('/admin/tasks/new')}>Create Task</Button>
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
    </div>
  )
}
