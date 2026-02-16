import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import TaskList from '@/components/features/tasks/TaskList'
import { listTasks } from '@/services/tasks'
import { spacing } from '@/config/tokens'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function ClientTasks() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await listTasks()
        setTasks(data)
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
        <Spinner size="lg" />
      </div>
    )
  }

  const filtered = tasks.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="My Tasks"
        actions={
          <Button onClick={() => navigate('/client/tasks/new')}>Submit New Task</Button>
        }
      />

      <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[4] }}>
        <div style={{ width: '200px' }}>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
        </div>
        <div style={{ width: '200px' }}>
          <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} options={PRIORITY_OPTIONS} />
        </div>
      </div>

      <TaskList
        tasks={filtered}
        onTaskClick={(task) => navigate(`/client/tasks/${task.id}`)}
      />
    </div>
  )
}
