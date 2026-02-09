import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import BrandProfileEditor from '@/components/features/brand/BrandProfileEditor'
import BrandGuideCard from '@/components/features/brand/BrandGuideCard'
import FileUpload from '@/components/ui/FileUpload'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function AdminBrandProfileEdit() {
  const { clientId } = useParams()
  const { addToast } = useToast()
  const [brandProfile, setBrandProfile] = useState(null)
  const [brandGuides, setBrandGuides] = useState([])
  const [logos, setLogos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [clientId])

  const loadData = async () => {
    try {
      const [profileRes, guidesRes] = await Promise.all([
        fetch(apiEndpoint(`/brand-profiles/${clientId}`), { headers: { ...getAuthHeaders() } }),
        fetch(apiEndpoint(`/brand-guides?client_id=${clientId}`), { headers: { ...getAuthHeaders() } })
      ])

      const profileJson = await profileRes.json()
      const guidesJson = await guidesRes.json()

      if (profileJson.success) {
        setBrandProfile(profileJson.data)
        // Fetch logos once we know the profile exists
        try {
          const logosRes = await fetch(apiEndpoint(`/brand-profiles/${clientId}/logos`), { headers: { ...getAuthHeaders() } })
          const logosJson = await logosRes.json()
          if (logosJson.success) setLogos(logosJson.data || [])
        } catch { /* logos table may not exist yet */ }
      }
      if (guidesJson.success) setBrandGuides(guidesJson.data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSection = async (sectionData) => {
    setSaving(true)
    try {
      const res = await fetch(apiEndpoint(`/brand-profiles/${clientId}`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sectionData)
      })

      const json = await res.json()

      if (json.success) {
        setBrandProfile(json.data)
        addToast('Section saved', 'success')
      } else {
        addToast(json.error || 'Failed to save', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddLogo = async (logoData) => {
    setSaving(true)
    try {
      const res = await fetch(apiEndpoint(`/brand-profiles/${clientId}/logos`), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(logoData)
      })
      const json = await res.json()
      if (json.success) {
        setLogos(prev => [json.data, ...prev])
        addToast('Logo added', 'success')
      } else {
        addToast(json.error || 'Failed to add logo', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLogo = async (logoId) => {
    setSaving(true)
    try {
      const res = await fetch(apiEndpoint(`/brand-profiles/${clientId}/logos/${logoId}`), {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      })
      const json = await res.json()
      if (json.success) {
        setLogos(prev => prev.filter(l => l.id !== logoId))
        addToast('Logo deleted', 'success')
      } else {
        addToast(json.error || 'Failed to delete logo', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadGuide = async (files) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('client_id', clientId)
      for (const file of files) {
        formData.append('files', file)
      }

      const res = await fetch(apiEndpoint('/brand-guides'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      })

      const json = await res.json()

      if (json.success) {
        setBrandGuides([...brandGuides, ...json.data])
        addToast('Brand guide uploaded successfully', 'success')
      } else {
        addToast(json.message || 'Failed to upload brand guide', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteGuide = async (guideId) => {
    if (!confirm('Are you sure you want to delete this brand guide?')) return

    try {
      const res = await fetch(apiEndpoint(`/brand-guides/${guideId}`), {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      })

      const json = await res.json()

      if (json.success) {
        setBrandGuides(brandGuides.filter(g => g.id !== guideId))
        addToast('Brand guide deleted successfully', 'success')
      } else {
        addToast(json.message || 'Failed to delete brand guide', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <Spinner size="lg" />
      </div>
    )
  }

  const backLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    color: colours.primary[500],
    textDecoration: 'none',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[4],
  }

  const sectionStyle = {
    marginBottom: spacing[8],
  }

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  }

  const sectionTitleStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
  }

  const guidesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: spacing[4],
  }

  return (
    <div>
      <Link to="/brand-profiles" style={backLinkStyle}>
        ← Back to Brand Profiles
      </Link>

      <PageHeader title="Edit Brand Profile" />

      <div style={sectionStyle}>
        <BrandProfileEditor
          profile={brandProfile}
          clientId={clientId}
          onSaveSection={handleSaveSection}
          logos={logos}
          onAddLogo={handleAddLogo}
          onDeleteLogo={handleDeleteLogo}
          saving={saving}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>Brand Guides</h2>
          <FileUpload
            onUpload={handleUploadGuide}
            multiple
            disabled={uploading}
            accept=".pdf,.doc,.docx"
          >
            Upload Guide
          </FileUpload>
        </div>

        {brandGuides.length > 0 ? (
          <div style={guidesGridStyle}>
            {brandGuides.map(guide => (
              <BrandGuideCard
                key={guide.id}
                guide={guide}
                onDelete={() => handleDeleteGuide(guide.id)}
                showActions
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No brand guides yet"
            message="Upload brand guides to help contractors understand the client's brand."
          />
        )}
      </div>
    </div>
  )
}
