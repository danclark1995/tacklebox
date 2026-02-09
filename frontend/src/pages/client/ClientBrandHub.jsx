import { useState, useEffect } from 'react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import BrandProfileView from '@/components/features/brand/BrandProfileView'
import BrandGuideCard from '@/components/features/brand/BrandGuideCard'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function ClientBrandHub() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [brandProfile, setBrandProfile] = useState(null)
  const [brandGuides, setBrandGuides] = useState([])
  const [logos, setLogos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, guidesRes] = await Promise.all([
          fetch(apiEndpoint(`/brand-profiles/${user.id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/brand-guides?client_id=${user.id}`), { headers: { ...getAuthHeaders() } })
        ])

        const profileJson = await profileRes.json()
        const guidesJson = await guidesRes.json()

        if (profileJson.success) {
          setBrandProfile(profileJson.data)
          try {
            const logosRes = await fetch(apiEndpoint(`/brand-profiles/${user.id}/logos`), { headers: { ...getAuthHeaders() } })
            const logosJson = await logosRes.json()
            if (logosJson.success) setLogos(logosJson.data || [])
          } catch { /* logos may not exist yet */ }
        }
        if (guidesJson.success) setBrandGuides(guidesJson.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id, addToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <Spinner size="lg" />
      </div>
    )
  }

  const sectionStyle = {
    marginBottom: spacing[8],
  }

  const sectionTitleStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    marginBottom: spacing[4],
  }

  const guidesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: spacing[4],
  }

  return (
    <div>
      <PageHeader title="Brand Hub" />

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Brand Profile</h2>
        {brandProfile ? (
          <BrandProfileView profile={brandProfile} clientName={user.display_name} companyName={user.company} logos={logos} />
        ) : (
          <EmptyState
            title="Your brand profile hasn't been set up yet."
            message="Contact your account manager to set up your brand profile."
          />
        )}
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Brand Guides</h2>
        {brandGuides.length > 0 ? (
          <div style={guidesGridStyle}>
            {brandGuides.map(guide => (
              <BrandGuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No brand guides yet"
            message="Your brand guides will appear here once uploaded."
          />
        )}
      </div>
    </div>
  )
}
