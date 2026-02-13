import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import useAuth from '@/hooks/useAuth'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import EmberLoader from '@/components/ui/EmberLoader'
import Leaderboard from '@/components/features/gamification/Leaderboard'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography } from '@/config/tokens'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
]

export default function AdminDashboard() {
  const { addToast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

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
        <EmberLoader size="lg" />
      </div>
    )
  }

  const submittedTasks = tasks.filter(t => t.status === 'submitted')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const reviewTasks = tasks.filter(t => t.status === 'review')
  const activeClients = users.filter(u => u.role === 'client' && u.active)
  const activeContractors = users.filter(u => u.role === 'contractor' && u.active)

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
    color: colours.neutral[900],
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
        <GlowCard style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Total Tasks</div>
          <div style={summaryValueStyle}>{tasks.length}</div>
        </GlowCard>

        <GlowCard style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Submitted</div>
          <div style={summaryValueStyle}>{submittedTasks.length}</div>
        </GlowCard>

        <GlowCard style={summaryCardStyle}>
          <div style={summaryLabelStyle}>In Progress</div>
          <div style={summaryValueStyle}>{inProgressTasks.length}</div>
        </GlowCard>

        <GlowCard style={summaryCardStyle}>
          <div style={summaryLabelStyle}>In Review</div>
          <div style={summaryValueStyle}>{reviewTasks.length}</div>
        </GlowCard>

        <GlowCard style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Active Clients</div>
          <div style={summaryValueStyle}>{activeClients.length}</div>
        </GlowCard>

        <GlowCard style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Active Campers</div>
          <div style={summaryValueStyle}>{activeContractors.length}</div>
        </GlowCard>
      </div>

      {/* Leaderboard Widget */}
      {Array.isArray(leaderboard) && leaderboard.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Top Performers</h2>
          <GlowCard padding="12px">
            <Leaderboard entries={leaderboard} currentUserId={user?.id} compact />
          </GlowCard>
        </div>
      )}

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Recent Tasks</h2>
        <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          {tasks
            .filter(t => !statusFilter || t.status === statusFilter)
            .slice(0, 10)
            .map(task => {
              const isOverdue = task.deadline && new Date(task.deadline) < new Date()
              return (
                <GlowCard
                  key={task.id}
                  glowOnHover
                  padding="16px 20px"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/tasks/${task.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: colours.neutral[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '12px', color: colours.neutral[500], marginTop: '2px' }}>
                        {[task.category_name, task.client_name].filter(Boolean).join(' \u00b7 ')}
                      </div>
                    </div>
                    {task.deadline && (
                      <span style={{
                        fontSize: '12px',
                        color: isOverdue ? '#ff4444' : colours.neutral[600],
                        fontWeight: isOverdue ? 600 : 400,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}>
                        Due: {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <StatusBadge status={task.status} />
                  </div>
                </GlowCard>
              )
            })}
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tasks')} style={{ marginTop: spacing[3], textDecoration: 'underline', padding: 0 }}>
          View all tasks
        </Button>
      </div>
    </div>
  )
}
