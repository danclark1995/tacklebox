import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, CheckSquare, Users, Palette, Wrench, Settings, BookOpen, User, Compass, Menu, Flame, DollarSign, Calendar, CreditCard, FolderOpen, ClipboardList } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import usePermissions from '@/hooks/usePermissions'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import WaveProgressBar from '@/components/ui/WaveProgressBar'
import { getMyGamification } from '@/services/gamification'
import { listMessages } from '@/services/support'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const ICON_SIZE = 18

// Icon lookup for permission-based nav items
const ICON_MAP = {
  Flame: <Flame size={ICON_SIZE} />,
  Home: <Home size={ICON_SIZE} />,
  CheckSquare: <CheckSquare size={ICON_SIZE} />,
  FolderOpen: <FolderOpen size={ICON_SIZE} />,
  Calendar: <Calendar size={ICON_SIZE} />,
  Palette: <Palette size={ICON_SIZE} />,
  Compass: <Compass size={ICON_SIZE} />,
  Wrench: <Wrench size={ICON_SIZE} />,
  Users: <Users size={ICON_SIZE} />,
  User: <User size={ICON_SIZE} />,
  Settings: <Settings size={ICON_SIZE} />,
  BookOpen: <BookOpen size={ICON_SIZE} />,
  CreditCard: <CreditCard size={ICON_SIZE} />,
  ClipboardList: <ClipboardList size={ICON_SIZE} />,
}

export default function Sidebar() {
  const { user, logout, updateLevel } = useAuth()
  const { level, levelName, isClient, isAdmin, navItems } = usePermissions()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const [xpData, setXpData] = useState(null)
  const [supportCount, setSupportCount] = useState(0)

  useEffect(() => {
    if (!user?.id || user?.role === 'client') return
    async function loadXP() {
      try {
        const data = await getMyGamification()
        setXpData(data)
        // Sync level to auth context
        if (data?.current_level) {
          updateLevel(data.current_level, data.current_level_details?.name || 'Volunteer')
        }
      } catch {}
    }
    loadXP()
  }, [user?.id, user?.role, updateLevel])

  useEffect(() => {
    if (!isAdmin) return
    async function loadSupportCount() {
      try {
        const messages = await listMessages()
        setSupportCount((messages || []).filter(m => m.status === 'open').length)
      } catch {}
    }
    loadSupportCount()
  }, [isAdmin])

  if (!user) return null

  // Phase 1: Build nav items based on level, using current role paths for backward compat
  const basePath = user.role === 'admin' ? '/admin' : user.role === 'client' ? '/client' : '/camper'
  let resolvedNavItems = []

  if (isClient) {
    resolvedNavItems = navItems.map(item => ({
      ...item,
      icon: ICON_MAP[item.icon] || ICON_MAP.Home,
    }))
  } else {
    // Camper nav — use admin paths for admin role users, camper paths for contractors
    resolvedNavItems = navItems.map(item => {
      // Remap /camper/manage/* paths to /admin/* for admin role users (Phase 1 compat)
      let path = item.path
      if (user.role === 'admin') {
        const pathMap = {
          '/camper': '/admin',
          '/camper/tasks': '/admin/tasks',
          '/camper/projects': '/admin/projects',
          '/camper/calendar': '/admin/calendar',
          '/camper/brands': '/admin/brands',
          '/camper/journey': '/admin/journey',
          '/camper/tools': '/admin/tools',
          '/camper/profile': '/admin/settings',
          '/camper/manage/tasks': '/admin/tasks',
          '/camper/manage/campers': '/admin/campers',
          '/camper/manage/brands': '/admin/brands',
          '/camper/manage/settings': '/admin/settings',
        }
        path = pathMap[item.path] || item.path
      }
      return { ...item, path, icon: ICON_MAP[item.icon] || ICON_MAP.Home }
    })

    // Deduplicate paths (admin mapping can create duplicates)
    const seen = new Set()
    resolvedNavItems = resolvedNavItems.filter(item => {
      if (seen.has(item.path)) return false
      seen.add(item.path)
      return true
    })
  }

  // XP progress for sidebar
  let xpProgress = 0
  if (xpData) {
    const currentXp = xpData.current_level_details?.xp_required || 0
    const nextXp = xpData.next_level?.xp_required || 0
    const xpNeeded = nextXp - currentXp
    xpProgress = xpNeeded > 0 ? Math.min(((xpData.total_xp - currentXp) / xpNeeded) * 100, 100) : 100
  }

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '200px',
    minWidth: '200px',
    maxWidth: '200px',
    flexShrink: 0,
    backgroundColor: colours.surface,
    borderRight: `1px solid ${colours.neutral[200]}`,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: `transform ${transitions.normal}`,
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
  }

  const sidebarStyleDesktop = {
    ...sidebarStyle,
    transform: 'translateX(0)',
  }

  const headerStyle = {
    padding: `${spacing[4]} ${spacing[4]}`,
    borderBottom: `1px solid ${colours.neutral[200]}`,
  }

  const logoStyle = {
    textDecoration: 'none',
    display: 'block',
  }

  const logoImgStyle = {
    height: '26px',
    width: 'auto',
  }

  const navStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: `${spacing[2]} ${spacing[3]}`,
  }

  const navItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: `${spacing[2]} ${spacing[3]}`,
    color: colours.neutral[600],
    textDecoration: 'none',
    borderRadius: radii.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.fast}`,
    marginBottom: '2px',
  }

  const activeNavItemStyle = {
    ...navItemStyle,
    backgroundColor: colours.neutral[200],
    color: colours.neutral[900],
  }

  const iconBoxStyle = {
    width: '18px',
    height: '18px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const footerStyle = {
    padding: spacing[3],
    borderTop: `1px solid ${colours.neutral[200]}`,
  }

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  }

  const userDetailsStyle = {
    flex: 1,
    minWidth: 0,
  }

  const userNameStyle = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const roleBadgeStyle = {
    fontSize: typography.fontSize.xs,
    color: colours.neutral[600],
    backgroundColor: colours.neutral[100],
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: radii.sm,
    display: 'inline-block',
    marginTop: spacing[1],
  }

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colours.overlay,
    zIndex: 99,
    display: isOpen ? 'block' : 'none',
  }

  const hamburgerButtonStyle = {
    position: 'fixed',
    top: spacing[4],
    left: spacing[4],
    zIndex: 101,
    display: 'none',
    padding: spacing[2],
    backgroundColor: colours.surface,
    border: `1px solid ${colours.neutral[200]}`,
    borderRadius: radii.md,
    cursor: 'pointer',
    color: colours.neutral[900],
  }

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .hamburger-button {
              display: block !important;
            }
            .sidebar-desktop {
              transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            }
          }
        `}
      </style>

      <div
        className="hamburger-button"
        style={hamburgerButtonStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </div>

      <div style={overlayStyle} onClick={() => setIsOpen(false)} />

      <aside className="sidebar-desktop" style={sidebarStyleDesktop}>
        <div style={headerStyle}>
          <a href="/" style={logoStyle}>
            <img src="/tacklebox_logo.png" alt="TackleBox" style={logoImgStyle} />
          </a>
        </div>

        <nav style={navStyle}>
          {resolvedNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/client' || item.path === '/camper'}
              style={({ isActive }) => isActive ? activeNavItemStyle : navItemStyle}
              onClick={() => setIsOpen(false)}
            >
              <span style={iconBoxStyle}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={footerStyle}>
          <div style={userInfoStyle}>
            <Avatar name={user.display_name} size="md" />
            <div style={userDetailsStyle}>
              <div style={userNameStyle}>{user.display_name}</div>
              <div style={roleBadgeStyle}>
                {isClient ? 'Client' : `L${level} · ${levelName}`}
              </div>
            </div>
            {!isClient && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(user.role === 'admin' ? '/admin/settings' : '/camper/profile')}
                style={{ padding: spacing[1], flexShrink: 0 }}
              >
                <Settings size={16} />
              </Button>
            )}
          </div>
          {!isClient && xpData && (
            <div style={{ marginBottom: spacing[2] }}>
              <div style={{ fontSize: '11px', color: colours.neutral[600], marginBottom: '4px' }}>
                {(xpData.total_xp || 0).toLocaleString()} XP
              </div>
              <WaveProgressBar progress={xpProgress} size="sm" />
              <div
                onClick={() => navigate(user.role === 'admin' ? '/admin/journey' : '/camper/journey')}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing[2],
                  marginTop: spacing[2], padding: `${spacing[2]} ${spacing[3]}`,
                  backgroundColor: colours.neutral[100], borderRadius: radii.md,
                  cursor: 'pointer', transition: `background-color ${transitions.fast}`,
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[200]}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
              >
                <DollarSign size={14} style={{ color: colours.neutral[600] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: colours.neutral[500] }}>Balance</div>
                  <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
                    ${(xpData.available_balance || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            style={{ width: '100%' }}
          >
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}
