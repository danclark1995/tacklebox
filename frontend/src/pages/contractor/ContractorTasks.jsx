import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame } from 'lucide-react'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import GlowCard from '@/components/ui/GlowCard'
import EmberLoader from '@/components/ui/EmberLoader'
import EmptyState from '@/components/ui/EmptyState'
import TaskList from '@/components/features/tasks/TaskList'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

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

export default function ContractorTasks() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [campfireTasks, setCampfireTasks] = useState([])
  const [confirmingClaim, setConfirmingClaim] = useState(null)
  const [claimingId, setClaimingId] = useState(null)
  const [fadingOut, setFadingOut] = useState(null)

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

  // Campfire tasks with 30s polling
  const loadCampfire = useCallback(async () => {
    try {
      const res = await fetch(apiEndpoint('/tasks/campfire'), { headers: { ...getAuthHeaders() } })
      const json = await res.json()
      if (json.success) setCampfireTasks(json.data)
    } catch {}
  }, [])

  useEffect(() => {
    loadCampfire()
    const interval = setInterval(loadCampfire, 30000)
    return () => clearInterval(interval)
  }, [loadCampfire])

  const handleClaim = async (taskId) => {
    setClaimingId(taskId)
    try {
      const res = await fetch(apiEndpoint(`/tasks/${taskId}/claim`), {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      })
      const json = await res.json()
      if (json.success) {
        setFadingOut(taskId)
        setTimeout(() => {
          setCampfireTasks(prev => prev.filter(t => t.id !== taskId))
          setFadingOut(null)
          setConfirmingClaim(null)
          addToast('Task claimed!', 'success')
          // Refresh own tasks
          fetch(apiEndpoint('/tasks'), { headers: { ...getAuthHeaders() } })
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

  return (
    <div>
      <PageHeader title="My Tasks" />

      <TaskList
        tasks={tasks}
        onTaskClick={(task) => navigate(`/camper/tasks/${task.id}`)}
      />

      {/* Campfire Section */}
      <div style={{
        marginTop: spacing[8],
        position: 'relative',
        padding: spacing[6],
        margin: `${spacing[8]} -${spacing[6]} 0`,
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)',
      }}>
        <h2 style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          color: colours.neutral[900],
          marginBottom: spacing[2],
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Flame size={16} />
          The Campfire
        </h2>
        <p style={{
          fontSize: typography.fontSize.sm,
          color: colours.neutral[500],
          marginBottom: spacing[4],
        }}>
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
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                          color: '#ffffff',
                          backgroundColor: '#222',
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
                      {!isConfirming ? (
                        <button
                          onClick={() => setConfirmingClaim(task.id)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#111111',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '12px',
                            padding: '6px 16px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          Pick Up
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleClaim(task.id)}
                            disabled={isClaiming}
                            style={{
                              backgroundColor: '#ffffff',
                              color: '#111111',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '12px',
                              padding: '6px 16px',
                              cursor: isClaiming ? 'wait' : 'pointer',
                              fontFamily: 'inherit',
                              opacity: isClaiming ? 0.7 : 1,
                            }}
                          >
                            {isClaiming ? 'Claiming...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmingClaim(null)}
                            style={{
                              backgroundColor: 'transparent',
                              color: colours.neutral[500],
                              border: '1px solid #333',
                              borderRadius: '6px',
                              fontSize: '12px',
                              padding: '6px 16px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </GlowCard>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
