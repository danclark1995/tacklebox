import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import useAuth from '@/hooks/useAuth'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import EmberLoader from '@/components/ui/EmberLoader'
import Leaderboard from '@/components/features/gamification/Leaderboard'
import RecentNotifications from '@/components/features/notifications/RecentNotifications'
import { listTasks } from '@/services/tasks'
import { listUsers } from '@/services/users'
import { getLeaderboard } from '@/services/gamification'
import { getAnalytics as getEarningsAnalytics } from '@/services/earnings'
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
  const [earningsSummary, setEarningsSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [tasksJson, usersJson] = await Promise.all([
          listTasks(),
          listUsers()
        ])
        if (tasksJson.success) setTasks(tasksJson.data)
        if (usersJson.success) setUsers(usersJson.data)

        // Fetch leaderboard + earnings (non-critical)
        try {
          const [lbJson, earningsJson] = await Promise.all([
            getLeaderboard().catch(() => null),
            getEarningsAnalytics().catch(() => null),
          ])
          if (lbJson?.success !== false) setLeaderboard(lbJson?.data || lbJson || [])
          if (earningsJson?.success) setEarningsSummary(earningsJson.data?.earnings_summary || null)
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
  const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && !['closed', 'approved', 'cancelled'].includes(t.status))
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

        {overdueTasks.length > 0 && (
          <GlowCard style={{ ...summaryCardStyle, cursor: 'pointer' }} onClick={() => setStatusFilter('')}>
            <div style={{ ...summaryLabelStyle, color: colours.status.danger }}>Overdue</div>
            <div style={{ ...summaryValueStyle, color: colours.status.danger }}>{overdueTasks.length}</div>
          </GlowCard>
        )}
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

      {/* Revenue Summary */}
      {earningsSummary && (earningsSummary.task_earnings > 0 || earningsSummary.total_campsite_share > 0) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Revenue</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: spacing[3] }}>
            <GlowCard style={{ padding: spacing[4] }}>
              <div style={summaryLabelStyle}>Task Payouts</div>
              <div style={{ ...summaryValueStyle, fontSize: typography.fontSize['2xl'] }}>
                ${Math.round(earningsSummary.task_earnings || 0).toLocaleString()}
              </div>
            </GlowCard>
            {earningsSummary.total_campsite_share > 0 && (
              <GlowCard style={{ padding: spacing[4] }}>
                <div style={summaryLabelStyle}>Campsite Share</div>
                <div style={{ ...summaryValueStyle, fontSize: typography.fontSize['2xl'] }}>
                  ${Math.round(earningsSummary.total_campsite_share || 0).toLocaleString()}
                </div>
              </GlowCard>
            )}
            <GlowCard style={{ padding: spacing[4] }}>
              <div style={summaryLabelStyle}>Bonuses Paid</div>
              <div style={{ ...summaryValueStyle, fontSize: typography.fontSize['2xl'] }}>
                ${Math.round(earningsSummary.bonus_earnings || 0).toLocaleString()}
              </div>
            </GlowCard>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div style={sectionStyle}>
        <RecentNotifications limit={5} />
      </div>

      {/* Recent Notifications */}
      <RecentNotifications limit={5} />

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        {task.complexity_level != null && (
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            backgroundColor: colours.neutral[200], color: colours.neutral[900],
                            padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.5px',
                          }}>
                            L{task.complexity_level}
                          </span>
                        )}
                        <span style={{ fontSize: '15px', fontWeight: 600, color: colours.neutral[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: colours.neutral[500], marginTop: '2px' }}>
                        <span>{[task.category_name, task.client_name].filter(Boolean).join(' \u00b7 ')}</span>
                        {task.estimated_hours && (
                          <span>🕐 {task.estimated_hours}h</span>
                        )}
                        {task.total_payout && (
                          <span style={{ fontWeight: 600, color: colours.neutral[700] }}>${Number(task.total_payout).toFixed(0)}</span>
                        )}
                      </div>
                    </div>
                    {task.deadline && (
                      <span style={{
                        fontSize: '12px',
                        color: isOverdue ? colours.status.danger : colours.neutral[600],
                        fontWeight: isOverdue ? 600 : 400,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}>
                        {isOverdue ? 'Overdue' : 'Due'}: {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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
