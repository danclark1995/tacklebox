import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import PageHeader from '@/components/ui/PageHeader'
import Tabs from '@/components/ui/Tabs'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const ROLE_VARIANTS = {
  admin: 'error',
  contractor: 'primary',
  client: 'info',
}

const TAB_KEYS = {
  ALL: 'all',
  TASKS: 'tasks',
  PROJECTS: 'projects',
  USERS: 'users',
  BRAND_GUIDES: 'brand_guides',
}

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const query = searchParams.get('q') || ''

  const rolePrefix = user?.role === 'admin' ? '/admin' : user?.role === 'client' ? '/client' : '/camper'

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(TAB_KEYS.ALL)
  const [hoveredItem, setHoveredItem] = useState(null)

  const fetchResults = useCallback(async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const typeParam = activeTab !== TAB_KEYS.ALL ? `&type=${activeTab}` : ''
      const res = await fetch(apiEndpoint(`/search?q=${encodeURIComponent(query)}${typeParam}`), {
        headers: { ...getAuthHeaders() },
      })
      const json = await res.json()
      if (json.success) {
        setResults(json.data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [query, activeTab])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const counts = results?.counts || {
    tasks: results?.tasks?.length || 0,
    projects: results?.projects?.length || 0,
    users: results?.users?.length || 0,
    brand_guides: results?.brand_guides?.length || 0,
  }

  const totalCount = counts.tasks + counts.projects + counts.users + counts.brand_guides

  const tabs = [
    { key: TAB_KEYS.ALL, label: 'All', count: totalCount },
    { key: TAB_KEYS.TASKS, label: 'Tasks', count: counts.tasks },
    { key: TAB_KEYS.PROJECTS, label: 'Projects', count: counts.projects },
    { key: TAB_KEYS.USERS, label: 'Users', count: counts.users },
    { key: TAB_KEYS.BRAND_GUIDES, label: 'Brand Guides', count: counts.brand_guides },
  ]

  // Styles
  const containerStyle = {
    fontFamily: typography.fontFamily.sans,
  }

  const tabContainerStyle = {
    marginBottom: spacing[6],
  }

  const resultSectionStyle = {
    marginBottom: spacing[6],
  }

  const sectionHeaderStyle = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: `${spacing[2]} 0`,
    marginBottom: spacing[2],
    borderBottom: `1px solid ${colours.neutral[200]}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  }

  const getResultCardStyle = (itemKey) => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    padding: `${spacing[3]} ${spacing[4]}`,
    borderRadius: radii.lg,
    backgroundColor: hoveredItem === itemKey ? colours.neutral[100] : colours.white,
    border: `1px solid ${colours.neutral[100]}`,
    marginBottom: spacing[2],
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
  })

  const resultTitleStyle = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[900],
    flex: 1,
  }

  const resultMetaStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[500],
  }

  const loadingContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    padding: spacing[12],
  }

  // Render helpers
  const renderTaskResult = (task) => (
    <div
      key={`task-${task.id}`}
      style={getResultCardStyle(`task-${task.id}`)}
      onClick={() => navigate(`${rolePrefix}/tasks/${task.id}`)}
      onMouseEnter={() => setHoveredItem(`task-${task.id}`)}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <div style={resultTitleStyle}>{task.title}</div>
      {task.status && <StatusBadge status={task.status} />}
      {task.project_name && <span style={resultMetaStyle}>{task.project_name}</span>}
    </div>
  )

  const renderProjectResult = (project) => (
    <div
      key={`project-${project.id}`}
      style={getResultCardStyle(`project-${project.id}`)}
      onClick={() => navigate(`${rolePrefix}/projects/${project.id}`)}
      onMouseEnter={() => setHoveredItem(`project-${project.id}`)}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <div style={resultTitleStyle}>{project.name}</div>
      {project.client_name && <span style={resultMetaStyle}>{project.client_name}</span>}
    </div>
  )

  const renderUserResult = (user) => (
    <div
      key={`user-${user.id}`}
      style={getResultCardStyle(`user-${user.id}`)}
      onClick={() => navigate('/admin/campers')}
      onMouseEnter={() => setHoveredItem(`user-${user.id}`)}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <div style={resultTitleStyle}>{user.display_name || user.name}</div>
      {user.role && (
        <Badge variant={ROLE_VARIANTS[user.role] || 'neutral'} size="sm">
          {user.role}
        </Badge>
      )}
      {user.email && <span style={resultMetaStyle}>{user.email}</span>}
    </div>
  )

  const renderBrandGuideResult = (guide) => (
    <div
      key={`guide-${guide.id}`}
      style={getResultCardStyle(`guide-${guide.id}`)}
      onClick={() => navigate(`${rolePrefix}/brands`)}
      onMouseEnter={() => setHoveredItem(`guide-${guide.id}`)}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <div style={resultTitleStyle}>{guide.title || guide.name}</div>
      {guide.client_name && <span style={resultMetaStyle}>{guide.client_name}</span>}
    </div>
  )

  const showTasks = activeTab === TAB_KEYS.ALL || activeTab === TAB_KEYS.TASKS
  const showProjects = activeTab === TAB_KEYS.ALL || activeTab === TAB_KEYS.PROJECTS
  const showUsers = activeTab === TAB_KEYS.ALL || activeTab === TAB_KEYS.USERS
  const showBrandGuides = activeTab === TAB_KEYS.ALL || activeTab === TAB_KEYS.BRAND_GUIDES

  return (
    <div style={containerStyle}>
      <PageHeader
        title={`Search Results for '${query}'`}
        subtitle={!loading && results ? `${totalCount} result${totalCount !== 1 ? 's' : ''} found` : undefined}
      />

      <div style={tabContainerStyle}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {loading ? (
        <div style={loadingContainerStyle}>
          <Spinner size="lg" />
        </div>
      ) : !results || totalCount === 0 ? (
        <EmptyState
          title="No results found"
          description={`We couldn't find anything matching '${query}'. Try a different search term.`}
          action={{
            label: 'Back to Dashboard',
            onClick: () => navigate('/'),
          }}
        />
      ) : (
        <div>
          {/* Tasks section */}
          {showTasks && results.tasks && results.tasks.length > 0 && (
            <div style={resultSectionStyle}>
              {activeTab === TAB_KEYS.ALL && (
                <div style={sectionHeaderStyle}>Tasks ({counts.tasks})</div>
              )}
              {results.tasks.map(renderTaskResult)}
            </div>
          )}

          {/* Projects section */}
          {showProjects && results.projects && results.projects.length > 0 && (
            <div style={resultSectionStyle}>
              {activeTab === TAB_KEYS.ALL && (
                <div style={sectionHeaderStyle}>Projects ({counts.projects})</div>
              )}
              {results.projects.map(renderProjectResult)}
            </div>
          )}

          {/* Users section */}
          {showUsers && results.users && results.users.length > 0 && (
            <div style={resultSectionStyle}>
              {activeTab === TAB_KEYS.ALL && (
                <div style={sectionHeaderStyle}>Users ({counts.users})</div>
              )}
              {results.users.map(renderUserResult)}
            </div>
          )}

          {/* Brand Guides section */}
          {showBrandGuides && results.brand_guides && results.brand_guides.length > 0 && (
            <div style={resultSectionStyle}>
              {activeTab === TAB_KEYS.ALL && (
                <div style={sectionHeaderStyle}>Brand Guides ({counts.brand_guides})</div>
              )}
              {results.brand_guides.map(renderBrandGuideResult)}
            </div>
          )}

          {/* Load more placeholder for future pagination */}
          {totalCount > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[4] }}>
              <Button variant="outline" onClick={fetchResults}>
                Load More Results
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
