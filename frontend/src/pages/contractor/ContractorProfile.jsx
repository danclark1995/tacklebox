import { useState, useRef, useCallback } from 'react'
import { Check, X } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import { updateProfile } from '@/services/users'
import { spacing, colours, typography } from '@/config/tokens'

export default function ContractorProfile() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [localOverrides, setLocalOverrides] = useState({})
  const savingRef = useRef(false)

  const getValue = (field) => {
    if (localOverrides[field] !== undefined) return localOverrides[field]
    if (field === 'display_name') return user?.display_name || ''
    if (field === 'company') return user?.company || ''
    return ''
  }

  const saveFieldValue = useCallback(async (field, value) => {
    if (!field || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const body = {}
      body[field] = value

      await updateProfile(user.id, body)
      setLocalOverrides(prev => ({ ...prev, [field]: value }))
      addToast('Updated', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }, [user?.id, addToast])

  const startEditing = (field) => {
    // If already editing another field, save it first
    if (editingField && editingField !== field) {
      saveFieldValue(editingField, editValue)
    }
    setEditingField(field)
    setEditValue(getValue(field))
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditValue('')
  }

  const handleSave = () => {
    if (editingField) {
      saveFieldValue(editingField, editValue)
      setEditingField(null)
      setEditValue('')
    }
  }

  const handleBlur = (e) => {
    // Don't save if clicking on the save/cancel buttons
    const relatedTarget = e.relatedTarget
    if (relatedTarget && relatedTarget.dataset.action) return
    handleSave()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') cancelEditing()
  }

  const fields = [
    { key: 'display_name', label: 'Display Name', editable: true },
    { key: 'email', label: 'Email', editable: false, value: user?.email },
    { key: 'company', label: 'Company', editable: true },
    { key: 'role', label: 'Role', editable: false, value: user?.role === 'contractor' ? 'Camper' : user?.role },
  ]

  return (
    <div>
      <PageHeader title="Profile" />

      <GlowCard style={{ maxWidth: '600px', padding: spacing[6] }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[4],
          marginBottom: spacing[6],
          paddingBottom: spacing[6],
          borderBottom: `1px solid ${colours.neutral[200]}`,
        }}>
          <Avatar name={user?.display_name} size="lg" />
          <div>
            <div style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colours.neutral[900],
            }}>
              {getValue('display_name') || user?.display_name}
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: colours.neutral[600],
            }}>
              {user?.email}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
          {fields.map(field => {
            const isEditing = editingField === field.key
            const displayValue = field.value !== undefined ? field.value : getValue(field.key)

            return (
              <div
                key={field.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${spacing[3]} ${spacing[2]}`,
                  borderRadius: '6px',
                  cursor: field.editable && !isEditing ? 'pointer' : 'default',
                  transition: 'background-color 150ms ease',
                }}
                onClick={() => {
                  if (field.editable && !isEditing) startEditing(field.key)
                }}
                onMouseEnter={e => {
                  if (field.editable && !isEditing) e.currentTarget.style.backgroundColor = colours.neutral[100]
                }}
                onMouseLeave={e => {
                  if (!isEditing) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    color: colours.neutral[500],
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {field.label}
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleBlur}
                          autoFocus
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-action="save"
                        onClick={(e) => { e.stopPropagation(); handleSave() }}
                        disabled={saving}
                        icon={<Check size={16} />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        data-action="cancel"
                        onClick={(e) => { e.stopPropagation(); cancelEditing() }}
                        icon={<X size={16} />}
                      />
                    </div>
                  ) : (
                    <div style={{
                      fontSize: typography.fontSize.base,
                      color: displayValue ? colours.neutral[900] : colours.neutral[500],
                    }}>
                      {displayValue || 'Not set'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </GlowCard>
    </div>
  )
}
