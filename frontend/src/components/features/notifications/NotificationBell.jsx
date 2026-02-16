import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, MessageCircle, Star, Clock, Zap, CreditCard, X } from 'lucide-react'
import { listNotifications, markRead, markAllRead } from '@/services/notifications'
import { colours, spacing, typography, shadows } from '@/config/tokens'

const TYPE_ICONS = {
  task_assigned: Zap,
  task_status: Star,
  comment: MessageCircle,
  bonus: Star,
  deadline: Clock,
  credits_low: CreditCard,
  system: Bell,
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await listNotifications(20)
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch { /* silent */ }
  }, [])

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(prev => !prev)
    if (!isOpen) fetchNotifications()
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      await markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
    } catch { /* silent */ }
    setLoading(false)
  }

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markRead(notif.id)
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch { /* silent */ }
    }
    if (notif.link) {
      setIsOpen(false)
      navigate(notif.link)
    }
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: spacing[2],
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'background-color 150ms ease',
          backgroundColor: isOpen ? colours.neutral[100] : 'transparent',
        }}
        onMouseEnter={(e) => { if (!isOpen) e.target.style.backgroundColor = colours.neutral[100] }}
        onMouseLeave={(e) => { if (!isOpen) e.target.style.backgroundColor = 'transparent' }}
      >
        <Bell size={20} color={colours.neutral[600]} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: colours.brand.primary,
            color: '#fff',
            fontSize: '10px',
            fontWeight: typography.fontWeight.bold,
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: spacing[2],
          width: '360px',
          maxHeight: '480px',
          backgroundColor: colours.surface,
          border: `1px solid ${colours.neutral[200]}`,
          borderRadius: '12px',
          boxShadow: shadows.lg,
          zIndex: 100,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: `${spacing[3]} ${spacing[4]}`,
            borderBottom: `1px solid ${colours.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: typography.fontSize.xs,
                  color: colours.brand.primary,
                  fontWeight: typography.fontWeight.medium,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: spacing[8],
                textAlign: 'center',
                color: colours.neutral[400],
                fontSize: typography.fontSize.sm,
              }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => {
                const Icon = TYPE_ICONS[notif.type] || Bell
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    style={{
                      padding: `${spacing[3]} ${spacing[4]}`,
                      display: 'flex',
                      gap: spacing[3],
                      cursor: notif.link ? 'pointer' : 'default',
                      backgroundColor: notif.is_read ? 'transparent' : colours.neutral[50],
                      borderBottom: `1px solid ${colours.neutral[100]}`,
                      transition: 'background-color 150ms ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.is_read ? 'transparent' : colours.neutral[50]}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: notif.is_read ? colours.neutral[100] : colours.brand.primary + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} color={notif.is_read ? colours.neutral[400] : colours.brand.primary} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: notif.is_read ? typography.fontWeight.normal : typography.fontWeight.medium,
                        color: colours.neutral[900],
                        lineHeight: 1.3,
                      }}>
                        {notif.title}
                      </div>
                      {notif.message && (
                        <div style={{
                          fontSize: typography.fontSize.xs,
                          color: colours.neutral[500],
                          marginTop: '2px',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {notif.message}
                        </div>
                      )}
                      <div style={{
                        fontSize: '11px',
                        color: colours.neutral[400],
                        marginTop: '4px',
                      }}>
                        {timeAgo(notif.created_at)}
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: colours.brand.primary,
                        flexShrink: 0,
                        marginTop: '6px',
                      }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
