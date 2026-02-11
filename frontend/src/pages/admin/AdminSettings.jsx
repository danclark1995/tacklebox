import { useState, useEffect } from 'react'
import { MessageSquare, Check, ChevronDown, ChevronUp } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import EmberLoader from '@/components/ui/EmberLoader'
import useToast from '@/hooks/useToast'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, typography, colours } from '@/config/tokens'
import { formatDateTime } from '@/utils/formatters'

export default function AdminSettings() {
  const { addToast } = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [resolving, setResolving] = useState(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const res = await fetch(apiEndpoint('/support'), {
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (json.success) {
        setMessages(json.data || [])
      }
    } catch (err) {
      addToast('Failed to load support messages', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id) => {
    setResolving(id)
    try {
      const res = await fetch(apiEndpoint(`/support/${id}`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      })
      const json = await res.json()
      if (json.success) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'resolved', resolved_at: new Date().toISOString() } : m))
        addToast('Message resolved', 'success')
      } else {
        addToast(json.error || 'Failed to resolve', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setResolving(null)
    }
  }

  const openCount = messages.filter(m => m.status === 'open').length

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[12] }}>
          <EmberLoader size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div style={{ marginBottom: spacing[6] }}>
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colours.neutral[900],
          marginBottom: spacing[4],
        }}>
          <MessageSquare size={18} />
          Support Messages
          {openCount > 0 && (
            <Badge variant="neutral">{openCount} open</Badge>
          )}
        </h2>

        {messages.length === 0 ? (
          <EmptyState
            title="No support messages"
            description="Client support messages will appear here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {messages.map(msg => {
              const isExpanded = expandedId === msg.id
              const isOpen = msg.status === 'open'

              return (
                <GlowCard key={msg.id} style={{ padding: 0, overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                    style={{
                      padding: `${spacing[4]} ${spacing[5]}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[3],
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        marginBottom: spacing[1],
                      }}>
                        <span style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          color: colours.neutral[900],
                        }}>
                          {msg.subject}
                        </span>
                        <Badge variant={isOpen ? 'warning' : 'neutral'}>
                          {isOpen ? 'Open' : 'Resolved'}
                        </Badge>
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        color: colours.neutral[600],
                      }}>
                        {msg.user_name || msg.user_email || 'Unknown'} · {formatDateTime(msg.created_at)}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {isExpanded && (
                    <div style={{
                      padding: `0 ${spacing[5]} ${spacing[4]}`,
                      borderTop: `1px solid ${colours.neutral[200]}`,
                      paddingTop: spacing[4],
                    }}>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        color: colours.neutral[800],
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        marginBottom: spacing[4],
                      }}>
                        {msg.message}
                      </div>

                      {msg.user_email && (
                        <div style={{
                          fontSize: typography.fontSize.xs,
                          color: colours.neutral[500],
                          marginBottom: spacing[3],
                        }}>
                          Reply to: {msg.user_email}
                        </div>
                      )}

                      {isOpen && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleResolve(msg.id) }}
                          disabled={resolving === msg.id}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} />
                            {resolving === msg.id ? 'Resolving...' : 'Mark Resolved'}
                          </span>
                        </Button>
                      )}

                      {msg.resolved_at && (
                        <div style={{
                          fontSize: typography.fontSize.xs,
                          color: colours.neutral[500],
                          marginTop: spacing[2],
                        }}>
                          Resolved {formatDateTime(msg.resolved_at)}
                        </div>
                      )}
                    </div>
                  )}
                </GlowCard>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
