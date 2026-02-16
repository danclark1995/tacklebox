import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import SearchBar from '@/components/ui/SearchBar'
import Avatar from '@/components/ui/Avatar'
import SearchDropdown from '@/components/features/search/SearchDropdown'
import useAuth from '@/hooks/useAuth'
import NotificationBell from '@/components/features/notifications/NotificationBell'
import { colours, spacing, typography, shadows } from '@/config/tokens'
import { SEARCH_DEBOUNCE_MS } from '@/config/constants'
import { searchAll } from '@/services/tasks'

export default function MainLayout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchContainerRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Debounced search
  const performSearch = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults(null)
      setShowSearchDropdown(false)
      return
    }

    setSearchLoading(true)
    setShowSearchDropdown(true)

    try {
      const json = await searchAll(query)
      if (json.success) {
        setSearchResults(json.data)
      }
    } catch {
      // silently fail
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (searchQuery.length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery)
      }, SEARCH_DEBOUNCE_MS)
    } else {
      setSearchResults(null)
      setShowSearchDropdown(false)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, performSearch])

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false)
      }
    }

    if (showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchDropdown])

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchSubmit = (value) => {
    if (value && value.trim().length > 0) {
      setShowSearchDropdown(false)
      navigate(`/search?q=${encodeURIComponent(value.trim())}`)
    }
  }

  const handleDropdownNavigate = (path) => {
    setShowSearchDropdown(false)
    setSearchQuery('')
    navigate(path)
  }

  const handleDropdownClose = () => {
    setShowSearchDropdown(false)
  }

  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: colours.background,
  }

  const mainStyle = {
    flex: 1,
    marginLeft: '200px',
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
    position: 'relative',
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

  return (
    <div style={containerStyle}>
      <Sidebar />
      <main style={mainStyle}>
        <header style={headerStyle}>
          <div style={searchContainerStyle} ref={searchContainerRef}>
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              onSubmit={handleSearchSubmit}
              placeholder="Search tasks, projects, users..."
              loading={searchLoading}
            />
            <SearchDropdown
              results={searchResults}
              query={searchQuery}
              loading={searchLoading}
              isOpen={showSearchDropdown}
              onClose={handleDropdownClose}
              onNavigate={handleDropdownNavigate}
            />
          </div>
          <div style={userInfoStyle}>
            <NotificationBell />
            <span style={userNameStyle}>{user?.display_name}</span>
            <Avatar name={user?.display_name} size="sm" />
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
