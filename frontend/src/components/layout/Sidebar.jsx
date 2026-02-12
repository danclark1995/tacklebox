import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Users, Palette, Wrench, Settings, BookOpen, User, Compass, Menu, Flame } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import WaveProgressBar from '@/components/ui/WaveProgressBar'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'
import { ROLES } from '@/config/constants'

const ICON_SIZE = 18

const navItemsByRole = {
  [ROLES.CLIENT]: [
    { path: '/client', label: 'Home', icon: <Home size={ICON_SIZE} /> },
    { path: '/client/tasks', label: 'Tasks', icon: <CheckSquare size={ICON_SIZE} /> },
    { path: '/client/brand-hub', label: 'Brand Hub', icon: <BookOpen size={ICON_SIZE} /> },
    { path: '/client/profile', label: 'Profile', icon: <User size={ICON_SIZE} /> },
  ],
  [ROLES.CONTRACTOR]: [
    { path: '/camper', label: 'Home', icon: <Flame size={ICON_SIZE} /> },
    { path: '/camper/tasks', label: 'Tasks', icon: <CheckSquare size={ICON_SIZE} /> },
    { path: '/camper/brands', label: 'Brands', icon: <Palette size={ICON_SIZE} /> },
    { path: '/camper/journey', label: 'Journey', icon: <Compass size={ICON_SIZE} /> },
    { path: '/camper/profile', label: 'Profile', icon: <User size={ICON_SIZE} /> },
  ],
  [ROLES.ADMIN]: [
    { path: '/admin', label: 'Home', icon: <Home size={ICON_SIZE} /> },
    { path: '/admin/tasks', label: 'Tasks', icon: <CheckSquare size={ICON_SIZE} /> },
    { path: '/admin/campers', label: 'Campers', icon: <Users size={ICON_SIZE} /> },
    { path: '/admin/brands', label: 'Brands', icon: <Palette size={ICON_SIZE} /> },
    { path: '/admin/journey', label: 'Journey', icon: <Compass size={ICON_SIZE} /> },
    { path: '/admin/tools', label: 'Tools', icon: <Wrench size={ICON_SIZE} /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings size={ICON_SIZE} /> },
  ],
}

const ROLE_DISPLAY = {
  client: 'Client',
  contractor: 'Camper',
  admin: 'Admin',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const [xpData, setXpData] = useState(null)
  const [supportCount, setSupportCount] = useState(0)

  useEffect(() => {
    if (user?.role !== 'contractor' || !user?.id) return
    async function loadXP() {
      try {
        const res = await fetch(apiEndpoint(`/gamification/xp/${user.id}`), {
          headers: { ...getAuthHeaders() },
        })
        const json = await res.json()
        if (json.success !== false) setXpData(json.data || json)
      } catch {}
    }
    loadXP()
  }, [user?.id, user?.role])

  useEffect(() => {
    if (user?.role !== 'admin') return
    async function loadSupportCount() {
      try {
        const res = await fetch(apiEndpoint('/support'), { headers: getAuthHeaders() })
        const json = await res.json()
        if (json.success) {
          setSupportCount((json.data || []).filter(m => m.status === 'open').length)
        }
      } catch {}
    }
    loadSupportCount()
  }, [user?.role])

  if (!user) return null

  const navItems = navItemsByRole[user.role] || []

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
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/client' || item.path === '/camper'}
              style={({ isActive }) => isActive ? activeNavItemStyle : navItemStyle}
              onClick={() => setIsOpen(false)}
            >
              <span style={iconBoxStyle}>{item.icon}</span>
              <span>{item.label}</span>
              {item.path === '/admin/settings' && supportCount > 0 && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: colours.neutral[900],
                  marginLeft: 'auto',
                  flexShrink: 0,
                }} />
              )}
            </NavLink>
          ))}
        </nav>

        <div style={footerStyle}>
          <div style={userInfoStyle}>
            <Avatar name={user.display_name} size="md" />
            <div style={userDetailsStyle}>
              <div style={userNameStyle}>{user.display_name}</div>
              <div style={roleBadgeStyle}>{ROLE_DISPLAY[user.role]}</div>
            </div>
          </div>
          {user.role === 'contractor' && xpData && (
            <div style={{ marginBottom: spacing[2] }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                Level {xpData.current_level || 1} · {(xpData.total_xp || 0).toLocaleString()} XP
              </div>
              <WaveProgressBar progress={xpProgress} size="sm" />
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
