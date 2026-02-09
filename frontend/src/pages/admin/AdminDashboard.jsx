import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import useAuth from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Select from '@/components/ui/Select'
import TaskList from '@/components/features/tasks/TaskList'
import Leaderboard from '@/components/features/gamification/Leaderboard'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography } from '@/config/tokens'

export default function AdminDashboard() {
  const { addToast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [contractorFilter, setContractorFilter] = useState('')

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

        // Fetch leaderboard (non-critical)
        try {
          const lbRes = await fetch(apiEndpoint('/gamification/leaderboard'), { headers: { ...getAuthHeaders() } })
          const lbJson = await lbRes.json()
          if (lbJson.success !== false) {
            setLeaderboard(lbJson.data || lbJson || [])
          }
        } catch { /* silently ignore */ }
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

  const submittedTasks = tasks.filter(t => t.status === 'submitted')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const reviewTasks = tasks.filter(t => t.status === 'review')
  const activeClients = users.filter(u => u.role === 'client' && u.active)
  const activeContractors = users.filter(u => u.role === 'contractor' && u.active)

  const filteredTasks = tasks.filter(task => {
    if (statusFilter && task.status !== statusFilter) return false
    if (clientFilter && task.client_id !== clientFilter) return false
    if (contractorFilter && task.contractor_id !== contractorFilter) return false
    return true
  })

  const headerStyle = {
    marginBottom: spacing[6],
  }

  const titleStyle = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
  }

  const summaryGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[8],
  }

  const summaryCardStyle = {
    padding: spacing[5],
  }

  const summaryLabelStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[600],
    marginBottom: spacing[2],
  }

  const summaryValueStyle = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.primary[500],
  }

  const alertValueStyle = {
    ...summaryValueStyle,
    color: colours.warning[500],
  }

  const filtersStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
  }

  const sectionStyle = {
    marginBottom: spacing[8],
  }

  const sectionTitleStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    marginBottom: spacing[4],
  }

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Admin Dashboard</h1>
      </div>

      <div style={summaryGridStyle}>
        <Card style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Total Tasks</div>
          <div style={summaryValueStyle}>{tasks.length}</div>
        </Card>

        <Card style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Submitted</div>
          <div style={summaryValueStyle}>{submittedTasks.length}</div>
        </Card>

        <Card style={summaryCardStyle}>
          <div style={summaryLabelStyle}>In Progress</div>
          <div style={summaryValueStyle}>{inProgressTasks.length}</div>
        </Card>

        <Card style={summaryCardStyle}>
          <div style={summaryLabelStyle}>In Review</div>
          <div style={alertValueStyle}>{reviewTasks.length}</div>
        </Card>

        <Card style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Active Clients</div>
          <div style={summaryValueStyle}>{activeClients.length}</div>
        </Card>

        <Card style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Active Campers</div>
          <div style={summaryValueStyle}>{activeContractors.length}</div>
        </Card>
      </div>

      {/* Leaderboard Widget */}
      {Array.isArray(leaderboard) && leaderboard.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Top Performers</h2>
          <Card padding="sm">
            <Leaderboard entries={leaderboard} currentUserId={user?.id} compact />
          </Card>
        </div>
      )}

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>All Tasks</h2>

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
          onTaskClick={(task) => navigate(`/tasks/${task.id}`)}
        />
      </div>
    </div>
  )
}
