import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import Button from '@/components/ui/Button'
import { colours, spacing, typography, radii, shadows, transitions } from '@/config/tokens'

const TYPE_LABELS = {
  social_image: 'Social Media',
  document: 'Document',
  presentation: 'Presentation',
  ad_creative: 'Ad Creative',
  ad_background: 'Ad Background',
}

const TYPE_FILTERS = [
  { value: '', label: 'All Types' },
  { value: 'social_image', label: 'Social Media' },
  { value: 'document', label: 'Documents' },
  { value: 'presentation', label: 'Presentations' },
  { value: 'ad_creative', label: 'Ad Creatives' },
]

export default function MyCreations() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [generations, setGenerations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  useEffect(() => {
    fetchGenerations()
  }, [filter, page])

  async function fetchGenerations() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 12 })
      if (filter) params.set('content_type', filter)
      const res = await fetch(apiEndpoint(`/generate/history?${params}`), { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) {
        setGenerations(data.data || [])
        setPagination(data.pagination || { total: 0, pages: 1 })
      }
    } catch {}
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this generation?')) return
    try {
      await fetch(apiEndpoint(`/generate/${id}`), { method: 'DELETE', headers: getAuthHeaders() })
      setGenerations(prev => prev.filter(g => g.id !== id))
    } catch {}
  }

  const containerStyle = { padding: spacing[6], maxWidth: '1000px', margin: '0 auto' }

  const backStyle = {
    display: 'inline-flex', alignItems: 'center', gap: spacing[1],
    color: colours.neutral[500], fontSize: typography.fontSize.sm,
    cursor: 'pointer', marginBottom: spacing[4],
  }

  const headerStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing[6],
  }

  const titleStyle = {
    fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
  }

  const filterRowStyle = {
    display: 'flex', gap: spacing[2], marginBottom: spacing[6],
  }

  const filterBtnStyle = (active) => ({
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: active ? colours.neutral[300] : colours.neutral[100],
    border: `1px solid ${active ? colours.neutral[400] : colours.neutral[200]}`,
    borderRadius: radii.md,
    color: active ? colours.neutral[900] : colours.neutral[600],
    fontSize: typography.fontSize.sm,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
  })

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: spacing[4],
  }

  const cardStyle = {
    backgroundColor: colours.surface,
    border: `1px solid ${colours.neutral[200]}`,
    borderRadius: radii.xl,
    overflow: 'hidden',
    transition: `all ${transitions.normal}`,
  }

  const cardPreviewStyle = {
    height: '180px',
    backgroundColor: colours.neutral[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  const cardBodyStyle = {
    padding: spacing[4],
  }

  const cardTypeStyle = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: spacing[1],
  }

  const cardPromptStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[700],
    lineHeight: typography.lineHeight.normal,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    marginBottom: spacing[2],
  }

  const cardFooterStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  const cardDateStyle = {
    fontSize: typography.fontSize.xs,
    color: colours.neutral[400],
  }

  const deleteStyle = {
    fontSize: typography.fontSize.xs,
    color: colours.error[500],
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: `${spacing[1]} ${spacing[2]}`,
  }

  const emptyStyle = {
    textAlign: 'center',
    padding: spacing[12],
    color: colours.neutral[500],
    fontSize: typography.fontSize.sm,
  }

  const paginationStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[6],
  }

  return (
    <div style={containerStyle}>
      <div style={backStyle} onClick={() => navigate('/admin/tools')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Create
      </div>

      <div style={headerStyle}>
        <h1 style={titleStyle}>AI Generations</h1>
        <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500] }}>
          {pagination.total} generation{pagination.total !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={filterRowStyle}>
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            style={filterBtnStyle(filter === f.value)}
            onClick={() => { setFilter(f.value); setPage(1) }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={emptyStyle}>Loading...</div>
      ) : generations.length === 0 ? (
        <div style={emptyStyle}>
          <div style={{ marginBottom: spacing[3] }}>No creations yet</div>
          <Button size="sm" onClick={() => navigate('/admin/tools')}>Create Something</Button>
        </div>
      ) : (
        <>
          <div style={gridStyle}>
            {generations.map(gen => (
              <div
                key={gen.id}
                style={cardStyle}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colours.neutral[400] }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colours.neutral[200] }}
              >
                <div style={cardPreviewStyle}>
                  {gen.result_type === 'image/png' ? (
                    <img
                      src={apiEndpoint(`/storage/${gen.result_path}`)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : gen.result_type === 'text/html' ? (
                    <iframe
                      src={apiEndpoint(`/storage/${gen.result_path}`)}
                      style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                      title=""
                    />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colours.neutral[300]} strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                </div>
                <div style={cardBodyStyle}>
                  <div style={cardTypeStyle}>{TYPE_LABELS[gen.content_type] || gen.content_type}</div>
                  <div style={cardPromptStyle}>{gen.user_prompt}</div>
                  <div style={cardFooterStyle}>
                    <div style={cardDateStyle}>
                      {gen.created_at ? new Date(gen.created_at).toLocaleDateString() : ''}
                    </div>
                    <button style={deleteStyle} onClick={() => handleDelete(gen.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div style={paginationStyle}>
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span style={{ padding: `${spacing[2]} ${spacing[3]}`, fontSize: typography.fontSize.sm, color: colours.neutral[500] }}>
                Page {page} of {pagination.pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
