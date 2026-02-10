import { useState, useEffect } from 'react'
import { Input, Textarea, Select, Button } from '@/components/ui'
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/config/constants'
import { colours, spacing } from '@/config/tokens'
import useAuth from '@/hooks/useAuth'

/**
 * ProjectForm
 *
 * Create/edit project form.
 * Fields: name, description, client (Select, admin only), status.
 */
export default function ProjectForm({
  onSubmit,
  clients = [],
  initialData = null,
  loading = false,
}) {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('admin')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    status: PROJECT_STATUSES.ACTIVE,
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        client_id: initialData.client_id || '',
        status: initialData.status || PROJECT_STATUSES.ACTIVE,
      })
    }
  }, [initialData])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters'
    }
    if (formData.name && formData.name.length > 255) {
      newErrors.name = 'Project name must be less than 255 characters'
    }
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }
    if (isAdmin && !formData.client_id) {
      newErrors.client_id = 'Client is required'
    }
    if (!formData.status) {
      newErrors.status = 'Status is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate() && onSubmit) {
      onSubmit(formData)
    }
  }

  const statusOptions = Object.values(PROJECT_STATUSES).map(status => ({
    value: status,
    label: PROJECT_STATUS_LABELS[status],
  }))

  const clientOptions = clients.map(c => ({
    value: c.id,
    label: `${c.display_name}${c.company ? ` (${c.company})` : ''}`,
  }))

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
      {/* Name */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Project Name <span style={{ color: colours.neutral[700] }}>*</span>
        </label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Brand Refresh 2026"
          disabled={loading}
        />
        {errors.name && (
          <span style={{ color: colours.neutral[700], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.name}
          </span>
        )}
      </div>

      {/* Description */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Description <span style={{ color: colours.neutral[700] }}>*</span>
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the project scope and goals..."
          rows={5}
          disabled={loading}
        />
        {errors.description && (
          <span style={{ color: colours.neutral[700], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.description}
          </span>
        )}
      </div>

      {/* Client (Admin only) */}
      {isAdmin && (
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: colours.neutral[700],
            marginBottom: spacing[2],
          }}>
            Client <span style={{ color: colours.neutral[700] }}>*</span>
          </label>
          <Select
            value={formData.client_id}
            onChange={(e) => handleChange('client_id', e.target.value)}
            options={clientOptions}
            placeholder="Select client"
            disabled={loading}
          />
          {errors.client_id && (
            <span style={{ color: colours.neutral[700], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
              {errors.client_id}
            </span>
          )}
        </div>
      )}

      {/* Status */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Status <span style={{ color: colours.neutral[700] }}>*</span>
        </label>
        <Select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          options={statusOptions}
          disabled={loading}
        />
        {errors.status && (
          <span style={{ color: colours.neutral[700], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.status}
          </span>
        )}
      </div>

      {/* Submit Button */}
      <div style={{ marginTop: spacing[2] }}>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Saving...' : initialData ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}
