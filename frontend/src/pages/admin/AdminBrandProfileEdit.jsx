import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, Check, Upload, X } from 'lucide-react'
import useToast from '@/hooks/useToast'
import useAuth from '@/hooks/useAuth'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import GlowCard from '@/components/ui/GlowCard'
import EmberLoader from '@/components/ui/EmberLoader'
import BrandProfileEditor from '@/components/features/brand/BrandProfileEditor'
import { getProfile as getBrandProfile, updateProfile as updateBrandProfile, extractProfile, getLogos, addLogo, deleteLogo, uploadGuidePdf, updateBrandFromProfile } from '@/services/brands'
import { getMyGamification } from '@/services/gamification'
import { spacing, colours, typography, radii, transitions } from '@/config/tokens'

export default function AdminBrandProfileEdit() {
  const { clientId } = useParams()
  const { addToast } = useToast()
  const { user } = useAuth()
  const [brandProfile, setBrandProfile] = useState(null)
  const [logos, setLogos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [canUpload, setCanUpload] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    loadData()
  }, [clientId])

  // Determine upload permission
  useEffect(() => {
    if (!user) return
    if (user.role === 'admin') {
      setCanUpload(true)
      return
    }
    if (user.role === 'contractor') {
      // Check level from gamification endpoint
      async function checkLevel() {
        try {
          const gamData = await getMyGamification()
          if (gamData && gamData.current_level >= 7) {
            setCanUpload(true)
          }
        } catch { /* leave canUpload false */ }
      }
      checkLevel()
    }
  }, [user])

  const loadData = async () => {
    try {
      const profileData = await getBrandProfile(clientId)
      setBrandProfile(profileData)
      try {
        const logosData = await getLogos(clientId)
        setLogos(logosData || [])
      } catch { /* logos table may not exist yet */ }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSection = async (sectionData) => {
    setSaving(true)
    try {
      const updated = await updateBrandProfile(clientId, sectionData)
      setBrandProfile(updated)
      addToast('Section saved', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddLogo = async (logoData) => {
    setSaving(true)
    try {
      const newLogo = await addLogo(clientId, logoData)
      setLogos(prev => [newLogo, ...prev])
      addToast('Logo added', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLogo = async (logoId) => {
    setSaving(true)
    try {
      await deleteLogo(clientId, logoId)
      setLogos(prev => prev.filter(l => l.id !== logoId))
      addToast('Logo deleted', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleExtract = async (file) => {
    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await extractProfile(clientId, formData)
      addToast('Brand profile extracted from PDF', 'success')
      return result
    } catch (err) {
      addToast(err.message, 'error')
      return null
    } finally {
      setExtracting(false)
    }
  }

  const handleUploadGuidePdf = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      addToast('Only PDF files are accepted', 'error')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      addToast('File size must be under 50MB', 'error')
      return
    }

    setUploadingPdf(true)
    setUploadProgress(10)
    try {
      const formData = new FormData()
      formData.append('file', file)

      setUploadProgress(30)
      const result = await uploadGuidePdf(clientId, formData)
      setUploadProgress(80)

      setBrandProfile(prev => prev ? { ...prev, brand_guide_path: result.brand_guide_path } : prev)
      setUploadProgress(100)
      addToast('Brand guide uploaded successfully', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setTimeout(() => {
        setUploadingPdf(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const handleRemoveGuide = async () => {
    setSaving(true)
    try {
      await updateBrandProfile(clientId, { brand_guide_path: null })
      setBrandProfile(prev => prev ? { ...prev, brand_guide_path: null } : prev)
      addToast('Brand guide removed', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePdfDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUploadGuidePdf(file)
  }

  const handlePdfFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) handleUploadGuidePdf(file)
    e.target.value = ''
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  const hasGuide = brandProfile && brandProfile.brand_guide_path

  return (
    <div>
      <Link to="/admin/brands" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing[2],
        color: colours.neutral[900],
        textDecoration: 'none',
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing[4],
      }}>
        ← Back to Brand Profiles
      </Link>

      <PageHeader title="Brand Breakdown" />

      {/* Brand Guide PDF Upload */}
      <div style={{ marginBottom: spacing[8] }}>
        <h2 style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          color: colours.neutral[900],
          marginBottom: spacing[4],
        }}>
          Brand Guide PDF
        </h2>

        {canUpload ? (
          <GlowCard style={{ padding: spacing[5] }}>
            {hasGuide && !uploadingPdf ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: radii.md,
                  backgroundColor: colours.neutral[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FileText size={20} color={colours.neutral[700]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colours.neutral[900],
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                  }}>
                    <Check size={14} color={colours.neutral[700]} />
                    brand-guide.pdf
                  </div>
                  <div style={{ fontSize: '12px', color: colours.neutral[500], marginTop: '2px' }}>
                    {brandProfile.brand_guide_path}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0 }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                    color: colours.neutral[700],
                    padding: `${spacing[2]} ${spacing[3]}`,
                    border: '1px solid #333',
                    borderRadius: radii.md,
                    transition: `border-color ${transitions.fast}`,
                  }}>
                    <Upload size={14} />
                    Replace
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveGuide}
                    disabled={saving}
                  >
                    <X size={14} />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {/* Upload progress */}
                {uploadingPdf && (
                  <div style={{ marginBottom: spacing[4] }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: spacing[2],
                      fontSize: typography.fontSize.sm,
                      color: colours.neutral[700],
                    }}>
                      <span>Uploading brand guide...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: colours.neutral[200],
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        backgroundColor: colours.neutral[900],
                        borderRadius: '2px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                )}

                {/* Drop zone */}
                {!uploadingPdf && (
                  <div
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handlePdfDrop}
                    style={{
                      border: `2px dashed ${isDragging ? colours.neutral[700] : colours.neutral[300]}`,
                      borderRadius: radii.lg,
                      padding: spacing[8],
                      textAlign: 'center',
                      backgroundColor: isDragging ? colours.neutral[100] : 'transparent',
                      transition: `all ${transitions.normal}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => document.getElementById('pdf-upload-input').click()}
                  >
                    <FileText size={32} color={colours.neutral[400]} style={{ margin: '0 auto 8px' }} />
                    <div style={{
                      fontSize: typography.fontSize.base,
                      color: colours.neutral[700],
                      marginBottom: spacing[1],
                    }}>
                      Drop PDF here or click to browse
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      color: colours.neutral[500],
                    }}>
                      PDF only, max 50MB
                    </div>
                    <input
                      id="pdf-upload-input"
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfFileSelect}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
              </div>
            )}
          </GlowCard>
        ) : (
          <GlowCard style={{ padding: spacing[5] }}>
            <div style={{
              textAlign: 'center',
              color: colours.neutral[500],
              fontSize: typography.fontSize.sm,
              padding: spacing[4],
            }}>
              Camp Leader rank required to upload brand guides
            </div>
          </GlowCard>
        )}
      </div>

      {/* Brand Profile Editor (the breakdown) */}
      <div style={{ marginBottom: spacing[8] }}>
        <BrandProfileEditor
          profile={brandProfile}
          clientId={clientId}
          onSaveSection={handleSaveSection}
          onExtract={handleExtract}
          extracting={extracting}
          logos={logos}
          onAddLogo={handleAddLogo}
          onDeleteLogo={handleDeleteLogo}
          saving={saving}
        />
      </div>
    </div>
  )
}
