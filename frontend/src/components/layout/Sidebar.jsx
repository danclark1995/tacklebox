import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { colours, spacing, typography, radii, shadows, transitions } from '@/config/tokens'
import { ROLES, ROLE_LABELS } from '@/config/constants'

const navItemsByRole = {
  [ROLES.CLIENT]: [
    { path: '/', label: 'Dashboard', icon: 'home' },
    { path: '/projects', label: 'Projects', icon: 'folder' },
    { path: '/tasks', label: 'My Tasks', icon: 'check-square' },
    { path: '/brand-hub', label: 'Brand Hub', icon: 'book' },
    { path: '/profile', label: 'Profile', icon: 'user' },
  ],
  [ROLES.CONTRACTOR]: [
    { path: '/', label: 'Dashboard', icon: 'home' },
    { path: '/tasks', label: 'My Tasks', icon: 'check-square' },
    { path: '/brand-guides', label: 'Brand Guides', icon: 'image' },
    { path: '/stats', label: 'My Stats', icon: 'award' },
    { path: '/profile', label: 'Profile', icon: 'user' },
  ],
  [ROLES.ADMIN]: [
    { path: '/', label: 'Dashboard', icon: 'home' },
    { path: '/tasks', label: 'All Tasks', icon: 'check-square' },
    { path: '/projects', label: 'Projects', icon: 'folder' },
    { path: '/users', label: 'Users', icon: 'users' },
    { path: '/brand-profiles', label: 'Brand Profiles', icon: 'book' },
    { path: '/templates', label: 'Templates', icon: 'file-text' },
    { path: '/categories', label: 'Categories', icon: 'grid' },
    { path: '/analytics', label: 'Analytics', icon: 'bar-chart' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ],
}

const icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  folder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  'check-square': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  book: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  award: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  'file-text': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  grid: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  'bar-chart': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243M9.879 9.879l-4.243-4.243m12.728 0l-4.243 4.243M9.879 14.121l-4.243 4.243" />
    </svg>
  ),
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const navItems = navItemsByRole[user.role] || []

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '260px',
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
    padding: spacing[6],
    borderBottom: `1px solid ${colours.neutral[200]}`,
  }

  const logoStyle = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.primary[500],
    textDecoration: 'none',
    display: 'block',
  }

  const navStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: spacing[4],
  }

  const navItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: `${spacing[3]} ${spacing[4]}`,
    color: colours.neutral[700],
    textDecoration: 'none',
    borderRadius: radii.lg,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.fast}`,
    marginBottom: spacing[1],
  }

  const activeNavItemStyle = {
    ...navItemStyle,
    backgroundColor: colours.primary[50],
    color: colours.primary[600],
  }

  const footerStyle = {
    padding: spacing[4],
    borderTop: `1px solid ${colours.neutral[200]}`,
  }

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </div>

      <div style={overlayStyle} onClick={() => setIsOpen(false)} />

      <aside className="sidebar-desktop" style={sidebarStyleDesktop}>
        <div style={headerStyle}>
          <a href="/" style={logoStyle}>
            TackleBox
          </a>
        </div>

        <nav style={navStyle}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => isActive ? activeNavItemStyle : navItemStyle}
              onClick={() => setIsOpen(false)}
            >
              {icons[item.icon]}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={footerStyle}>
          <div style={userInfoStyle}>
            <Avatar name={user.name} size="md" />
            <div style={userDetailsStyle}>
              <div style={userNameStyle}>{user.name}</div>
              <div style={roleBadgeStyle}>{ROLE_LABELS[user.role]}</div>
            </div>
          </div>
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
