import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle, MessageSquare, Award, Clock, CreditCard, Info } from 'lucide-react'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import { listNotifications, markRead } from '@/services/notifications'
import { colours, spacing, typography, radii } from '@/config/tokens'

const TYPE_ICONS = {
  task_assigned: CheckCircle,
  task_status: Clock,
  comment: MessageSquare,
  bonus: Award,
  deadline: Clock,
  credits_low: CreditCard,
  system: Info,
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function RecentNotifications({ limit = 5 }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const json = await listNotifications(limit)
        if (json.success) setNotifications(json.data?.notifications || [])
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [limit])

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      try { await markRead(notif.id) } catch {}
    }
    if (notif.link) navigate(notif.link)
  }

  if (loading || notifications.length === 0) return null

  return (
    <div style={{ marginBottom: spacing[8] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
        <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
          Recent Notifications
        </h2>
      </div>
      <GlowCard padding="0">
        {notifications.map((notif, i) => {
          const Icon = TYPE_ICONS[notif.type] || Bell
          return (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing[3],
                padding: `${spacing[3]} ${spacing[4]}`,
                cursor: notif.link ? 'pointer' : 'default',
                borderBottom: i < notifications.length - 1 ? `1px solid ${colours.neutral[200]}` : 'none',
                backgroundColor: notif.is_read ? 'transparent' : `${colours.brand.primary}08`,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { if (notif.link) e.currentTarget.style.backgroundColor = colours.neutral[200] }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = notif.is_read ? 'transparent' : `${colours.brand.primary}08` }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: radii.md,
                backgroundColor: notif.is_read ? colours.neutral[200] : `${colours.brand.primary}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px',
              }}>
                <Icon size={14} color={notif.is_read ? colours.neutral[400] : colours.brand.primary} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: notif.is_read ? typography.fontWeight.normal : typography.fontWeight.medium, color: colours.neutral[900] }}>
                  {notif.title}
                </div>
                {notif.message && (
                  <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {notif.message}
                  </div>
                )}
              </div>
              <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[400], flexShrink: 0, marginTop: '2px' }}>
                {timeAgo(notif.created_at)}
              </div>
            </div>
          )
        })}
      </GlowCard>
    </div>
  )
}
