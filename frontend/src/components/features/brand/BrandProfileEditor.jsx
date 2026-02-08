import { useState, useEffect } from 'react'
import { Input, Textarea, FileUpload, Button } from '@/components/ui'
import ColourSwatch from '@/components/ui/ColourSwatch'
import { colours, spacing } from '@/config/tokens'

/**
 * BrandProfileEditor
 *
 * Admin form to create/edit a brand profile.
 * Fields: logo upload, brand colours (dynamic list), voice/tone, core values,
 * mission statement, target audience, dos, don'ts, additional notes.
 * For colours: "Add Colour" button that adds a row with name + hex input with preview.
 */
export default function BrandProfileEditor({
  profile = null,
  clientId,
  onSubmit,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    logo: null,
    logo_path: '',
    brand_colours: [],
    voice_tone: '',
    core_values: '',
    mission_statement: '',
    target_audience: '',
    dos: '',
    donts: '',
    additional_notes: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (profile) {
      const brandColours = profile.brand_colours ? JSON.parse(profile.brand_colours) : []
      setFormData({
        logo: null,
        logo_path: profile.logo_path || '',
        brand_colours: brandColours,
        voice_tone: profile.voice_tone || '',
        core_values: profile.core_values || '',
        mission_statement: profile.mission_statement || '',
        target_audience: profile.target_audience || '',
        dos: profile.dos || '',
        donts: profile.donts || '',
        additional_notes: profile.additional_notes || '',
      })
    }
  }, [profile])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleAddColour = () => {
    setFormData(prev => ({
      ...prev,
      brand_colours: [...prev.brand_colours, { name: '', hex: '#000000' }],
    }))
  }

  const handleRemoveColour = (index) => {
    setFormData(prev => ({
      ...prev,
      brand_colours: prev.brand_colours.filter((_, i) => i !== index),
    }))
  }

  const handleColourChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      brand_colours: prev.brand_colours.map((colour, i) =>
        i === index ? { ...colour, [field]: value } : colour
      ),
    }))
  }

  const validate = () => {
    const newErrors = {}
    // Brand profile fields are mostly optional, but we can add validation if needed
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate() && onSubmit) {
      onSubmit({
        ...formData,
        client_id: clientId,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
      {/* Logo Upload */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Brand Logo
        </label>
        {formData.logo_path && !formData.logo && (
          <div style={{ marginBottom: spacing[3] }}>
            <img
              src={formData.logo_path}
              alt="Current logo"
              style={{
                maxWidth: '200px',
                maxHeight: '100px',
                objectFit: 'contain',
                border: `1px solid ${colours.neutral[200]}`,
                borderRadius: '4px',
                padding: spacing[2],
              }}
            />
          </div>
        )}
        <FileUpload
          onFilesChange={(files) => handleChange('logo', files[0])}
          accept="image/*"
          disabled={loading}
        />
      </div>

      {/* Brand Colours */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Brand Colours
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          {formData.brand_colours.map((colour, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 150px 40px',
                gap: spacing[3],
                alignItems: 'center',
                padding: spacing[3],
                backgroundColor: colours.neutral[50],
                borderRadius: '6px',
              }}
            >
              <Input
                value={colour.name}
                onChange={(e) => handleColourChange(index, 'name', e.target.value)}
                placeholder="Colour name (e.g., Primary)"
                disabled={loading}
              />
              <div style={{ position: 'relative' }}>
                <Input
                  type="color"
                  value={colour.hex}
                  onChange={(e) => handleColourChange(index, 'hex', e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', height: '40px' }}
                />
              </div>
              <Button
                type="button"
                variant="error"
                size="sm"
                onClick={() => handleRemoveColour(index)}
                disabled={loading}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddColour}
          disabled={loading}
          style={{ marginTop: spacing[3] }}
        >
          + Add Colour
        </Button>
      </div>

      {/* Voice & Tone */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Voice & Tone
        </label>
        <Textarea
          value={formData.voice_tone}
          onChange={(e) => handleChange('voice_tone', e.target.value)}
          placeholder="Describe the brand's communication style..."
          rows={4}
          disabled={loading}
        />
      </div>

      {/* Core Values */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Core Values
        </label>
        <Textarea
          value={formData.core_values}
          onChange={(e) => handleChange('core_values', e.target.value)}
          placeholder="What does the brand stand for?"
          rows={4}
          disabled={loading}
        />
      </div>

      {/* Mission Statement */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Mission Statement
        </label>
        <Textarea
          value={formData.mission_statement}
          onChange={(e) => handleChange('mission_statement', e.target.value)}
          placeholder="Why does the brand exist?"
          rows={3}
          disabled={loading}
        />
      </div>

      {/* Target Audience */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Target Audience
        </label>
        <Textarea
          value={formData.target_audience}
          onChange={(e) => handleChange('target_audience', e.target.value)}
          placeholder="Who does the brand serve?"
          rows={3}
          disabled={loading}
        />
      </div>

      {/* Dos */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Brand Usage - Do
        </label>
        <Textarea
          value={formData.dos}
          onChange={(e) => handleChange('dos', e.target.value)}
          placeholder="What should be done when using the brand?"
          rows={4}
          disabled={loading}
        />
      </div>

      {/* Don'ts */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Brand Usage - Don't
        </label>
        <Textarea
          value={formData.donts}
          onChange={(e) => handleChange('donts', e.target.value)}
          placeholder="What should be avoided?"
          rows={4}
          disabled={loading}
        />
      </div>

      {/* Additional Notes */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Additional Notes
        </label>
        <Textarea
          value={formData.additional_notes}
          onChange={(e) => handleChange('additional_notes', e.target.value)}
          placeholder="Any other brand information..."
          rows={3}
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <div style={{ marginTop: spacing[2] }}>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Saving...' : profile ? 'Update Brand Profile' : 'Create Brand Profile'}
        </Button>
      </div>
    </form>
  )
}
