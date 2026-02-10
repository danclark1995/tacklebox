import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import GlowCard from '@/components/ui/GlowCard'
import EmberLoader from '@/components/ui/EmberLoader'
import EmptyState from '@/components/ui/EmptyState'
import TaskList from '@/components/features/tasks/TaskList'
import XPBar from '@/components/features/gamification/XPBar'
import BadgeGrid from '@/components/features/gamification/BadgeGrid'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography, radii, shadows } from '@/config/tokens'

export default function ContractorDashboard() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [xpData, setXpData] = useState(null)
  const [badges, setBadges] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const headers = { ...getAuthHeaders() }
        const res = await fetch(apiEndpoint('/tasks'), { headers })
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

  // Fetch gamification data in parallel
  useEffect(() => {
    if (!user?.id) return

    async function loadGamification() {
      try {
        const headers = { ...getAuthHeaders() }
        const [xpRes, badgesRes] = await Promise.all([
          fetch(apiEndpoint(`/gamification/xp/${user.id}`), { headers }),
          fetch(apiEndpoint(`/gamification/badges/${user.id}`), { headers }),
        ])
        const [xpJson, badgesJson] = await Promise.all([
          xpRes.json(),
          badgesRes.json(),
        ])
        if (xpJson.success !== false) setXpData(xpJson.data || xpJson)
        const badgesArray = badgesJson.data || badgesJson
        if (Array.isArray(badgesArray)) setBadges(badgesArray)
      } catch {
        // Gamification data is non-critical — silently ignore errors
      }
    }
    loadGamification()
  }, [user?.id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  const assignedTasks = tasks.filter(t => ['assigned', 'in_progress', 'review', 'revision'].includes(t.status))
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const awaitingActionTasks = tasks.filter(t => ['assigned', 'revision'].includes(t.status))

  const sortedTasks = [...assignedTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    if (a.due_date && b.due_date) {
      return new Date(a.due_date) - new Date(b.due_date)
    }
    return 0
  })

  const headerStyle = {
    marginBottom: spacing[6],
  }

  const titleStyle = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
    marginBottom: spacing[2],
  }

  const subtitleStyle = {
    fontSize: typography.fontSize.base,
    color: colours.neutral[600],
  }

  const summaryGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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

  const gamificationWidgetStyle = {
    marginBottom: spacing[8],
  }

  const viewStatsLinkStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: '#ffffff',
    textDecoration: 'none',
  }

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Welcome back, {user?.display_name || user?.name}</h1>
        <p style={subtitleStyle}>Here are your assigned tasks</p>
      </div>

      <div style={summaryGridStyle}>
        <GlowCard style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Assigned Tasks</div>
          <div style={summaryValueStyle}>{assignedTasks.length}</div>
        </GlowCard>

        <GlowCard style={summaryCardStyle}>
          <div style={summaryLabelStyle}>In Progress</div>
          <div style={summaryValueStyle}>{inProgressTasks.length}</div>
        </GlowCard>

        <GlowCard style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Awaiting Action</div>
          <div style={summaryValueStyle}>{awaitingActionTasks.length}</div>
        </GlowCard>
      </div>

      {/* Gamification Section */}
      {xpData && (
        <div style={gamificationWidgetStyle}>
          <h2 style={sectionTitleStyle}>Your Progress</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
            <GlowCard>
              <XPBar xpData={xpData} />
              <div style={{ marginTop: spacing[3] }}>
                <Link
                  to="/camper/journey"
                  style={viewStatsLinkStyle}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  View Your Journey &rarr;
                </Link>
              </div>
            </GlowCard>
            <GlowCard>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[3] }}>
                Badges Earned
              </div>
              {badges.filter(b => b.earned).length > 0 ? (
                <BadgeGrid badges={badges} compact />
              ) : (
                <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500] }}>
                  Complete tasks to earn badges
                </div>
              )}
            </GlowCard>
          </div>
        </div>
      )}

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>My Tasks</h2>
        {sortedTasks.length > 0 ? (
          <TaskList
            tasks={sortedTasks}
            onTaskClick={(task) => navigate(`/camper/tasks/${task.id}`)}
          />
        ) : (
          <EmptyState
            title="No tasks assigned to you yet."
            message="Tasks will appear here once assigned by an admin."
          />
        )}
      </div>
    </div>
  )
}
