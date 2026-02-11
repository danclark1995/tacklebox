import { useState, useEffect } from 'react'
import { Building2, ChevronRight } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import GlowCard from '@/components/ui/GlowCard'
import EmberLoader from '@/components/ui/EmberLoader'
import EmptyState from '@/components/ui/EmptyState'
import BrandProfileView from '@/components/features/brand/BrandProfileView'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function ContractorBrandGuides() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [brandProfiles, setBrandProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [logos, setLogos] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiEndpoint('/brand-profiles'), { headers: { ...getAuthHeaders() } })
        const json = await res.json()
        if (json.success) setBrandProfiles(json.data || [])
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  const handleViewProfile = async (profile) => {
    setSelectedProfile(profile)
    try {
      const res = await fetch(apiEndpoint(`/brand-profiles/${profile.client_id}/logos`), {
        headers: { ...getAuthHeaders() }
      })
      const json = await res.json()
      if (json.success) setLogos(json.data || [])
    } catch { /* logos may not exist */ }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  // Slide-over panel for viewing a brand profile
  if (selectedProfile) {
    return (
      <div>
        <button
          onClick={() => { setSelectedProfile(null); setLogos([]) }}
          style={{
            background: 'none',
            border: 'none',
            color: colours.neutral[900],
            cursor: 'pointer',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            fontFamily: 'inherit',
            marginBottom: spacing[4],
            padding: 0,
          }}
        >
          ← Back to Brands
        </button>
        <BrandProfileView
          profile={selectedProfile}
          clientName={selectedProfile.client_name}
          companyName={selectedProfile.client_company}
          logos={logos}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Brands" />

      {brandProfiles.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: spacing[4],
        }}>
          {brandProfiles.map(profile => (
            <GlowCard
              key={profile.id}
              glowOnHover
              padding="0"
              onClick={() => handleViewProfile(profile)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ padding: spacing[5] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[3] }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: colours.neutral[200],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Building2 size={18} color={colours.neutral[700]} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colours.neutral[900],
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {profile.client_name || 'Client'}
                    </div>
                    {profile.client_company && (
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        color: colours.neutral[600],
                      }}>
                        {profile.client_company}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} color={colours.neutral[500]} />
                </div>

                {profile.industry && (
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: colours.neutral[500],
                    marginBottom: spacing[2],
                  }}>
                    {profile.industry}
                  </div>
                )}

                {profile.tagline && (
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: colours.neutral[600],
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                  }}>
                    "{profile.tagline}"
                  </div>
                )}
              </div>
            </GlowCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No brand profiles available"
          message="Brand profiles from your assigned clients will appear here."
        />
      )}
    </div>
  )
}
