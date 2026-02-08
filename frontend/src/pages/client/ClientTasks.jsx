import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import TaskList from '@/components/features/tasks/TaskList'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing } from '@/config/tokens'

export default function ClientTasks() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiEndpoint('/tasks'), { headers: { ...getAuthHeaders() } })
        const json = await res.json()
        if (json.success) setTasks(json.data)
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

  return (
    <div>
      <PageHeader
        title="My Tasks"
        actions={
          <Button onClick={() => navigate('/tasks/new')}>New Task</Button>
        }
      />
      <TaskList
        tasks={tasks}
        onTaskClick={(task) => navigate(`/tasks/${task.id}`)}
      />
    </div>
  )
}
