import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Flame, Wrench, ChevronDown } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import ConfirmAction from '@/components/ui/ConfirmAction'
import EmberLoader from '@/components/ui/EmberLoader'
import EmptyState from '@/components/ui/EmptyState'
import TaskList from '@/components/features/tasks/TaskList'
import XPBar from '@/components/features/gamification/XPBar'
import BadgeGrid from '@/components/features/gamification/BadgeGrid'
import ToolboxGrid from '@/components/features/ToolboxGrid'
import RecentNotifications from '@/components/features/notifications/RecentNotifications'
import { apiFetch } from '@/services/apiFetch'
import { colours, spacing, typography, radii, shadows } from '@/config/tokens'

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return `${Math.floor(diff / 604800)}w ago`
}

export default function ContractorDashboard() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [xpData, setXpData] = useState(null)
  const [badges, setBadges] = useState([])
  const [campfireTasks, setCampfireTasks] = useState([])
  const [confirmingClaim, setConfirmingClaim] = useState(null)
  const [claimingId, setClaimingId] = useState(null)
  const [fadingOut, setFadingOut] = useState(null)
  const [toolboxTools, setToolboxTools] = useState([])
  const [showAllTools, setShowAllTools] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const json = await apiFetch('/tasks')
        if (json.success) setTasks(json.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  // Fetch campfire tasks + 30s polling
  const loadCampfire = useCallback(async () => {
    try {
      const json = await apiFetch('/tasks/campfire')
      if (json.success) setCampfireTasks(json.data)
    } catch {}
  }, [])

  useEffect(() => {
    loadCampfire()
    const interval = setInterval(loadCampfire, 30000)
    return () => clearInterval(interval)
  }, [loadCampfire])

  // Fetch gamification data in parallel
  useEffect(() => {
    if (!user?.id) return

    async function loadGamification() {
      try {
        const [xpJson, badgesJson] = await Promise.all([
          apiFetch(`/gamification/xp/${user.id}`),
          apiFetch(`/gamification/badges/${user.id}`),
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

  useEffect(() => {
    async function loadToolbox() {
      try {
        const json = await apiFetch('/tools')
        if (json.success) setToolboxTools(json.data || [])
      } catch {}
    }
    loadToolbox()
  }, [])

  const handleClaim = async (taskId) => {
    setClaimingId(taskId)
    try {
      const json = await apiFetch(`/tasks/${taskId}/claim`, { method: 'POST' })
      if (json.success) {
        setFadingOut(taskId)
        setTimeout(() => {
          setCampfireTasks(prev => prev.filter(t => t.id !== taskId))
          setFadingOut(null)
          setConfirmingClaim(null)
          addToast('Task claimed!', 'success')
          // Refresh own tasks
          apiFetch('/tasks')
            .then(r => r.json())
            .then(j => { if (j.success) setTasks(j.data) })
        }, 400)
      } else {
        addToast(json.error || 'This task was just claimed by someone else', 'error')
        setCampfireTasks(prev => prev.filter(t => t.id !== taskId))
        setConfirmingClaim(null)
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setClaimingId(null)
    }
  }

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
    color: colours.neutral[900],
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

      {/* Campfire Section */}
      <div style={{
        ...sectionStyle,
        position: 'relative',
        padding: spacing[6],
        margin: `0 -${spacing[6]}`,
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)',
      }}>
        <h2 style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={16} />
          The Campfire
        </h2>
        <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[4], marginTop: `-${spacing[2]}` }}>
          Available tasks to pick up
        </p>

        {campfireTasks.length === 0 ? (
          <GlowCard padding="32px" style={{
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, #111111 70%)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <EmberLoader size="sm" />
              <span style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500] }}>
                No tasks at the campfire right now
              </span>
            </div>
          </GlowCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {campfireTasks.map(task => {
              const isFading = fadingOut === task.id
              const isConfirming = confirmingClaim === task.id
              const isClaiming = claimingId === task.id

              return (
                <GlowCard
                  key={task.id}
                  glowOnHover
                  padding="16px 20px"
                  style={{
                    transition: 'all 400ms ease',
                    opacity: isFading ? 0 : 1,
                    transform: isFading ? 'scale(0.98)' : 'scale(1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Left: title + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: colours.neutral[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '12px', color: colours.neutral[500], marginTop: '2px' }}>
                        {[task.category_name, task.client_name].filter(Boolean).join(' \u00b7 ')}
                      </div>
                    </div>

                    {/* Middle: priority + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {task.priority && (
                        <span style={{
                          fontSize: '11px',
                          color: colours.neutral[900],
                          backgroundColor: colours.neutral[200],
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #333',
                        }}>
                          {task.priority}
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: colours.neutral[500] }}>
                        {formatRelativeTime(task.created_at)}
                      </span>
                    </div>

                    {/* Right: action button(s) */}
                    <div style={{ flexShrink: 0, display: 'flex', gap: '6px' }}>
                      <ConfirmAction
                        trigger={<Button size="sm">Pick Up</Button>}
                        confirmLabel={isClaiming ? 'Claiming...' : 'Confirm'}
                        onConfirm={() => handleClaim(task.id)}
                      />
                    </div>
                  </div>
                </GlowCard>
              )
            })}
          </div>
        )}
      </div>

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

      {/* Recent Notifications */}
      <RecentNotifications limit={5} />

      {/* Toolbox Section */}
      {toolboxTools.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={16} />
            Toolbox
          </h2>
          <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[4], marginTop: `-${spacing[2]}` }}>
            Resources and tools for your work
          </p>
          <ToolboxGrid tools={showAllTools ? toolboxTools : toolboxTools.slice(0, 6)} />
          {toolboxTools.length > 6 && !showAllTools && (
            <div style={{ textAlign: 'center', marginTop: spacing[4] }}>
              <Button variant="ghost" size="sm" onClick={() => setShowAllTools(true)} icon={<ChevronDown size={14} />}>
                View all ({toolboxTools.length})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
