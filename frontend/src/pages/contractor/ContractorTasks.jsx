import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Tag, Building2 } from 'lucide-react'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import GlowCard from '@/components/ui/GlowCard'
import EmberLoader from '@/components/ui/EmberLoader'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
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
          addToast('Task claimed! Check your tasks.', 'success')
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: spacing[4],
          }}>
            {campfireTasks.map(task => {
              const isFading = fadingOut === task.id
              const isConfirming = confirmingClaim === task.id
              const isClaiming = claimingId === task.id

              return (
                <GlowCard
                  key={task.id}
                  glowOnHover
                  padding="20px"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, #111111 70%)',
                    transition: 'all 400ms ease',
                    opacity: isFading ? 0 : 1,
                    transform: isFading ? 'scale(0.95)' : 'scale(1)',
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                    {task.title}
                  </div>

                  {task.category_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colours.neutral[500], marginBottom: '4px' }}>
                      <Tag size={12} />
                      {task.category_name}
                    </div>
                  )}

                  {task.client_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colours.neutral[500], marginBottom: '8px' }}>
                      <Building2 size={12} />
                      {task.client_name}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
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
                    {task.complexity_level != null && (
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #333',
                        backgroundColor: '#111',
                        color: task.complexity_level === 0 ? '#ffffff' : colours.neutral[500],
                        boxShadow: task.complexity_level === 0 ? '0 0 6px rgba(255,255,255,0.3)' : 'none',
                        fontWeight: 600,
                      }}>
                        L{task.complexity_level}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: colours.neutral[500] }}>
                      {formatRelativeTime(task.created_at)}
                    </span>
                  </div>

                  {!isConfirming ? (
                    <Button
                      variant="primary"
                      size="sm"
                      style={{
                        width: '100%',
                        backgroundColor: '#ffffff',
                        color: '#111111',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                      }}
                      onClick={() => setConfirmingClaim(task.id)}
                    >
                      Pick Up
                    </Button>
                  ) : (
                    <div>
                      <div style={{ fontSize: '13px', color: colours.neutral[500], marginBottom: '8px', textAlign: 'center' }}>
                        Claim this task?
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          style={{
                            flex: 1,
                            backgroundColor: '#ffffff',
                            color: '#111111',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                          }}
                          onClick={() => handleClaim(task.id)}
                          disabled={isClaiming}
                        >
                          {isClaiming ? 'Claiming...' : 'Confirm'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ flex: 1, borderRadius: '6px' }}
                          onClick={() => setConfirmingClaim(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </GlowCard>
              )
            })}
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .campfire-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
