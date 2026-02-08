import { useState, useEffect } from 'react'
import { Input, Select, Button } from '@/components/ui'
import { ROLES, ROLE_LABELS, VALIDATION } from '@/config/constants'
import { colours, spacing } from '@/config/tokens'

/**
 * UserForm
 *
 * Create/edit user form (admin).
 * Fields: display_name, email, role (Select: client/contractor/admin), company, password (create only, required).
 */
export default function UserForm({
  user = null,
  onSubmit,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    role: ROLES.CLIENT,
    company: '',
    password: '',
  })

  const [errors, setErrors] = useState({})
  const isEditMode = !!user

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        email: user.email || '',
        role: user.role || ROLES.CLIENT,
        company: user.company || '',
        password: '', // Never pre-fill password
      })
    }
  }, [user])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.display_name || formData.display_name.trim().length < 2) {
      newErrors.display_name = 'Name must be at least 2 characters'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    } else if (formData.email.length > VALIDATION.EMAIL_MAX_LENGTH) {
      newErrors.email = `Email must be less than ${VALIDATION.EMAIL_MAX_LENGTH} characters`
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    // Password validation for create mode only
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
        newErrors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate() && onSubmit) {
      // Don't send empty password in edit mode
      const submitData = { ...formData }
      if (isEditMode && !submitData.password) {
        delete submitData.password
      }
      onSubmit(submitData)
    }
  }

  const roleOptions = Object.values(ROLES).map(role => ({
    value: role,
    label: ROLE_LABELS[role],
  }))

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
      {/* Display Name */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Full Name <span style={{ color: colours.error[500] }}>*</span>
        </label>
        <Input
          value={formData.display_name}
          onChange={(e) => handleChange('display_name', e.target.value)}
          placeholder="e.g., John Smith"
          disabled={loading}
        />
        {errors.display_name && (
          <span style={{ color: colours.error[500], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.display_name}
          </span>
        )}
      </div>

      {/* Email */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Email <span style={{ color: colours.error[500] }}>*</span>
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="email@example.com"
          disabled={loading || isEditMode}
        />
        {isEditMode && (
          <span style={{ fontSize: '12px', color: colours.neutral[500], marginTop: spacing[1], display: 'block' }}>
            Email cannot be changed after account creation
          </span>
        )}
        {errors.email && (
          <span style={{ color: colours.error[500], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.email}
          </span>
        )}
      </div>

      {/* Role */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Role <span style={{ color: colours.error[500] }}>*</span>
        </label>
        <Select
          value={formData.role}
          onChange={(e) => handleChange('role', e.target.value)}
          options={roleOptions}
          disabled={loading}
        />
        {errors.role && (
          <span style={{ color: colours.error[500], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.role}
          </span>
        )}
      </div>

      {/* Company (optional) */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Company (optional)
        </label>
        <Input
          value={formData.company}
          onChange={(e) => handleChange('company', e.target.value)}
          placeholder="e.g., Acme Corp"
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Password {!isEditMode && <span style={{ color: colours.error[500] }}>*</span>}
          {isEditMode && ' (leave blank to keep current)'}
        </label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder={isEditMode ? 'Leave blank to keep current password' : 'Enter password'}
          disabled={loading}
        />
        {!isEditMode && (
          <span style={{ fontSize: '12px', color: colours.neutral[500], marginTop: spacing[1], display: 'block' }}>
            Must be at least 8 characters with uppercase, lowercase, and number
          </span>
        )}
        {errors.password && (
          <span style={{ color: colours.error[500], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.password}
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
          {loading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  )
}
