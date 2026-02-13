import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, FileText } from 'lucide-react'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import GlowCard from '@/components/ui/GlowCard'
import EmberLoader from '@/components/ui/EmberLoader'
import EmptyState from '@/components/ui/EmptyState'
import BrandBooklet from '@/components/features/brand/BrandBooklet'
import BrandGuidePDFViewer from '@/components/features/brand/BrandGuidePDFViewer'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function AdminBrandProfiles() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingProfile, setViewingProfile] = useState(null)
  const [viewingLogos, setViewingLogos] = useState([])
  const [viewingClient, setViewingClient] = useState(null)
  const [pdfViewerClientId, setPdfViewerClientId] = useState(null)

  const handleViewProfile = async (client) => {
    try {
      const res = await fetch(apiEndpoint(`/brand-profiles/${client.id}`), { headers: { ...getAuthHeaders() } })
      const json = await res.json()
      if (json.success && json.data) {
        setViewingProfile(json.data)
        setViewingClient(client)
        try {
          const logosRes = await fetch(apiEndpoint(`/brand-profiles/${client.id}/logos`), { headers: { ...getAuthHeaders() } })
          const logosJson = await logosRes.json()
          if (logosJson.success) setViewingLogos(logosJson.data || [])
        } catch { /* logos may not exist */ }
      } else {
        addToast('No brand profile found for this client', 'info')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiEndpoint('/users?role=client'), {
          headers: { ...getAuthHeaders() }
        })
        const json = await res.json()
        if (json.success) setClients(json.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  const clientsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: spacing[4],
  }

  const cardStyle = {
    padding: spacing[5],
  }

  const clientNameStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    marginBottom: spacing[1],
  }

  const clientCompanyStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[600],
    marginBottom: spacing[4],
  }

  const clientEmailStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[500],
    marginBottom: spacing[4],
  }

  return (
    <div>
      {viewingProfile && (
        <BrandBooklet
          brandProfile={viewingProfile}
          clientName={viewingClient?.display_name || viewingClient?.name}
          companyName={viewingClient?.company}
          logos={viewingLogos}
          onClose={() => { setViewingProfile(null); setViewingLogos([]); setViewingClient(null) }}
        />
      )}
      {pdfViewerClientId && (
        <BrandGuidePDFViewer
          clientId={pdfViewerClientId}
          onClose={() => setPdfViewerClientId(null)}
        />
      )}
      <PageHeader
        title="Brand Profiles"
        actions={<Button onClick={() => navigate('/admin/brands/new')}>Create Brand Profile</Button>}
      />

      {clients.length > 0 ? (
        <div style={clientsGridStyle}>
          {clients.map(client => (
            <GlowCard key={client.id} style={cardStyle}>
              <div style={clientNameStyle}>{client.display_name || client.name}</div>
              {client.company && <div style={clientCompanyStyle}>{client.company}</div>}
              <div style={clientEmailStyle}>{client.email}</div>
              <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleViewProfile(client)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <BookOpen size={14} />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPdfViewerClientId(client.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileText size={14} />
                  Brand Guide
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate(`/admin/brands/${client.id}/edit`)}
                >
                  Edit
                </Button>
              </div>
            </GlowCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No clients found"
          message="Clients will appear here once added to the system."
        />
      )}
    </div>
  )
}
