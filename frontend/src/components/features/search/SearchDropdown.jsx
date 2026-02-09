import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, typography, radii, shadows, transitions } from '@/config/tokens'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from '@/components/ui/StatusBadge'
import Badge from '@/components/ui/Badge'

const ROLE_VARIANTS = {
  admin: 'error',
  contractor: 'primary',
  client: 'info',
}

const SearchDropdown = ({ results, query, loading, isOpen, onClose, onNavigate }) => {
  const dropdownRef = useRef(null)
  const [hoveredItem, setHoveredItem] = useState(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const containerStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colours.white,
    boxShadow: shadows.lg,
    borderRadius: `0 0 ${radii.lg} ${radii.lg}`,
    zIndex: 200,
    maxHeight: '400px',
    overflowY: 'auto',
    border: `1px solid ${colours.neutral[200]}`,
    borderTop: 'none',
  }

  const loadingContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  }

  const noResultsStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colours.neutral[500],
    padding: spacing[6],
    textAlign: 'center',
  }

  const groupHeaderStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: `${spacing[2]} ${spacing[4]}`,
    backgroundColor: colours.neutral[50],
    borderBottom: `1px solid ${colours.neutral[100]}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  }

  const getRowStyle = (itemKey) => ({
    fontFamily: typography.fontFamily.sans,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: `${spacing[2]} ${spacing[4]}`,
    cursor: 'pointer',
    backgroundColor: hoveredItem === itemKey ? colours.primary[50] : colours.white,
    transition: `background-color ${transitions.fast}`,
    borderBottom: `1px solid ${colours.neutral[50]}`,
  })

  const rowTitleStyle = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[900],
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const rowSubtitleStyle = {
    fontSize: typography.fontSize.xs,
    color: colours.neutral[500],
    whiteSpace: 'nowrap',
  }

  const iconStyle = {
    display: 'flex',
    alignItems: 'center',
    color: colours.neutral[400],
    flexShrink: 0,
  }

  // Loading state
  if (loading) {
    return (
      <div ref={dropdownRef} style={containerStyle}>
        <div style={loadingContainerStyle}>
          <Spinner size="sm" />
        </div>
      </div>
    )
  }

  // No results or no data
  if (!results) return null

  const { tasks = [], projects = [], users = [], brand_guides = [] } = results
  const counts = results.counts || {
    tasks: tasks.length,
    projects: projects.length,
    users: users.length,
    brand_guides: brand_guides.length,
  }

  const totalResults = counts.tasks + counts.projects + counts.users + counts.brand_guides

  if (totalResults === 0) {
    return (
      <div ref={dropdownRef} style={containerStyle}>
        <div style={noResultsStyle}>
          No results for '{query}'
        </div>
      </div>
    )
  }

  const handleNavigate = (path) => {
    onNavigate(path)
    onClose()
  }

  // SVG icons for group headers
  const TaskIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  )

  const ProjectIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  )

  const UserIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )

  const BrandIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  )

  return (
    <div ref={dropdownRef} style={containerStyle}>
      {/* Tasks */}
      {tasks.length > 0 && (
        <div>
          <div style={groupHeaderStyle}>
            <span style={iconStyle}><TaskIcon /></span>
            Tasks ({counts.tasks})
          </div>
          {tasks.map((task) => (
            <div
              key={`task-${task.id}`}
              style={getRowStyle(`task-${task.id}`)}
              onClick={() => handleNavigate(`/tasks/${task.id}`)}
              onMouseEnter={() => setHoveredItem(`task-${task.id}`)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div style={rowTitleStyle}>{task.title}</div>
              {task.status && <StatusBadge status={task.status} />}
              {task.project_name && (
                <span style={rowSubtitleStyle}>{task.project_name}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <div style={groupHeaderStyle}>
            <span style={iconStyle}><ProjectIcon /></span>
            Projects ({counts.projects})
          </div>
          {projects.map((project) => (
            <div
              key={`project-${project.id}`}
              style={getRowStyle(`project-${project.id}`)}
              onClick={() => handleNavigate(`/projects/${project.id}`)}
              onMouseEnter={() => setHoveredItem(`project-${project.id}`)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div style={rowTitleStyle}>{project.name}</div>
              {project.client_name && (
                <span style={rowSubtitleStyle}>{project.client_name}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {users.length > 0 && (
        <div>
          <div style={groupHeaderStyle}>
            <span style={iconStyle}><UserIcon /></span>
            Users ({counts.users})
          </div>
          {users.map((user) => (
            <div
              key={`user-${user.id}`}
              style={getRowStyle(`user-${user.id}`)}
              onClick={() => handleNavigate('/users')}
              onMouseEnter={() => setHoveredItem(`user-${user.id}`)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div style={rowTitleStyle}>{user.display_name || user.name}</div>
              {user.role && (
                <Badge variant={ROLE_VARIANTS[user.role] || 'neutral'} size="sm">
                  {user.role}
                </Badge>
              )}
              {user.email && (
                <span style={rowSubtitleStyle}>{user.email}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Brand Guides */}
      {brand_guides.length > 0 && (
        <div>
          <div style={groupHeaderStyle}>
            <span style={iconStyle}><BrandIcon /></span>
            Brand Guides ({counts.brand_guides})
          </div>
          {brand_guides.map((guide) => (
            <div
              key={`guide-${guide.id}`}
              style={getRowStyle(`guide-${guide.id}`)}
              onClick={() => handleNavigate('/brand-hub')}
              onMouseEnter={() => setHoveredItem(`guide-${guide.id}`)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div style={rowTitleStyle}>{guide.title || guide.name}</div>
              {guide.client_name && (
                <span style={rowSubtitleStyle}>{guide.client_name}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

SearchDropdown.propTypes = {
  results: PropTypes.shape({
    tasks: PropTypes.array,
    users: PropTypes.array,
    projects: PropTypes.array,
    brand_guides: PropTypes.array,
    counts: PropTypes.shape({
      tasks: PropTypes.number,
      users: PropTypes.number,
      projects: PropTypes.number,
      brand_guides: PropTypes.number,
    }),
  }),
  query: PropTypes.string,
  loading: PropTypes.bool,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
}

export default SearchDropdown
