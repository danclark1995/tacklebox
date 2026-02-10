import { useState, useEffect } from 'react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import EmberLoader from '@/components/ui/EmberLoader'
import EmptyState from '@/components/ui/EmptyState'
import BrandGuideCard from '@/components/features/brand/BrandGuideCard'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing } from '@/config/tokens'

export default function ContractorBrandGuides() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [brandGuides, setBrandGuides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiEndpoint('/brand-guides'), { headers: { ...getAuthHeaders() } })
        const json = await res.json()
        if (json.success) setBrandGuides(json.data)
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

  const guidesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: spacing[4],
  }

  return (
    <div>
      <PageHeader title="Brand Guides" />

      {brandGuides.length > 0 ? (
        <div style={guidesGridStyle}>
          {brandGuides.map(guide => (
            <BrandGuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No brand guides available"
          message="Brand guides from your assigned clients will appear here."
        />
      )}
    </div>
  )
}
