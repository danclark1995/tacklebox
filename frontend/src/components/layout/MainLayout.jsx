import { useState } from 'react'
import Sidebar from './Sidebar'
import SearchBar from '@/components/ui/SearchBar'
import Avatar from '@/components/ui/Avatar'
import useAuth from '@/hooks/useAuth'
import { colours, spacing, typography, shadows } from '@/config/tokens'

export default function MainLayout({ children }) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: colours.background,
  }

  const mainStyle = {
    flex: 1,
    marginLeft: '260px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'margin-left 200ms ease',
  }

  const headerStyle = {
    backgroundColor: colours.surface,
    borderBottom: `1px solid ${colours.neutral[200]}`,
    padding: `${spacing[4]} ${spacing[6]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[6],
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: shadows.sm,
  }

  const searchContainerStyle = {
    flex: 1,
    maxWidth: '600px',
  }

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  }

  const userNameStyle = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[900],
    whiteSpace: 'nowrap',
  }

  const contentStyle = {
    flex: 1,
    padding: spacing[6],
    overflowY: 'auto',
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  return (
    <div style={containerStyle}>
      <Sidebar />
      <main style={mainStyle}>
        <header style={headerStyle}>
          <div style={searchContainerStyle}>
            <SearchBar
              placeholder="Search tasks, projects, users..."
              onSearch={handleSearch}
            />
          </div>
          <div style={userInfoStyle}>
            <span style={userNameStyle}>{user?.name}</span>
            <Avatar name={user?.name} size="sm" />
          </div>
        </header>
        <div style={contentStyle}>
          {children}
        </div>
      </main>
      <style>
        {`
          @media (max-width: 768px) {
            main {
              margin-left: 0 !important;
            }
          }
        `}
      </style>
    </div>
  )
}
