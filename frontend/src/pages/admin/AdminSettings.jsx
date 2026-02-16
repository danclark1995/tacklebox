import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Users, MessageSquare, Check, ChevronDown, ChevronUp } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import EmberLoader from '@/components/ui/EmberLoader'
import useToast from '@/hooks/useToast'
import { listMessages, updateMessage } from '@/services/support'
import { listUsers } from '@/services/users'
import { spacing, typography, colours } from '@/config/tokens'
import { formatDateTime } from '@/utils/formatters'

export default function AdminSettings() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [resolving, setResolving] = useState(null)
  const [companyName, setCompanyName] = useState('TackleBox')
  const [tagline, setTagline] = useState('Creative project management')

  useEffect(() => {
    async function loadAll() {
      try {
        const [messagesData, usersData] = await Promise.all([
          listMessages(),
          listUsers(),
        ])
        setMessages(messagesData || [])
        setUsers(usersData || [])
      } catch (err) {
        addToast('Failed to load settings data', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [addToast])

  const handleResolve = async (id) => {
    setResolving(id)
    try {
      const data = await updateMessage(id, { status: 'resolved' })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'resolved', resolved_at: new Date().toISOString() } : m))
      addToast('Message resolved', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setResolving(null)
    }
  }

  const openCount = messages.filter(m => m.status === 'open').length
  const totalUsers = users.length
  const activeCampers = users.filter(u => (u.role === 'contractor' || u.role === 'admin') && u.is_active).length
  const activeClients = users.filter(u => u.role === 'client' && u.is_active).length

  const sectionTitleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    marginBottom: spacing[4],
  }

  const statCardStyle = {
    padding: spacing[5],
    textAlign: 'center',
  }

  const statLabelStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[600],
    marginBottom: spacing[2],
  }

  const statValueStyle = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
  }

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

      {/* Section 1: Platform Settings */}
      <div style={{ marginBottom: spacing[8] }}>
        <h2 style={sectionTitleStyle}>
          <Settings size={18} />
          Platform Settings
        </h2>
        <GlowCard style={{ padding: spacing[5] }}>
          <div style={{ marginBottom: spacing[4] }}>
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: spacing[5] }}>
            <Input
              label="Tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
            <Button onClick={() => addToast('Settings saved', 'success')}>Save</Button>
            <span style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500] }}>
              More settings coming soon
            </span>
          </div>
        </GlowCard>
      </div>

      {/* Section 2: User Management */}
      <div style={{ marginBottom: spacing[8] }}>
        <h2 style={sectionTitleStyle}>
          <Users size={18} />
          User Management
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: spacing[4],
          marginBottom: spacing[4],
        }}>
          <GlowCard style={statCardStyle}>
            <div style={statLabelStyle}>Total Users</div>
            <div style={statValueStyle}>{totalUsers}</div>
          </GlowCard>
          <GlowCard style={statCardStyle}>
            <div style={statLabelStyle}>Active Campers</div>
            <div style={statValueStyle}>{activeCampers}</div>
          </GlowCard>
          <GlowCard style={statCardStyle}>
            <div style={statLabelStyle}>Active Clients</div>
            <div style={statValueStyle}>{activeClients}</div>
          </GlowCard>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')} style={{ textDecoration: 'underline', padding: 0 }}>
          Manage Users
        </Button>
      </div>

      {/* Section 3: Support Messages */}
      <div style={{ marginBottom: spacing[6] }}>
        <h2 style={sectionTitleStyle}>
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
