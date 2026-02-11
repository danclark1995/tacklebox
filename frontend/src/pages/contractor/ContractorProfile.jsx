import { useState } from 'react'
import { Check, X } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import GlowCard from '@/components/ui/GlowCard'
import Avatar from '@/components/ui/Avatar'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function ContractorProfile() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Local state for optimistic updates
  const [localOverrides, setLocalOverrides] = useState({})

  const getValue = (field) => {
    if (localOverrides[field] !== undefined) return localOverrides[field]
    if (field === 'display_name') return user?.display_name || user?.name || ''
    if (field === 'company') return user?.company || ''
    return ''
  }

  const startEditing = (field) => {
    setEditingField(field)
    setEditValue(getValue(field))
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditValue('')
  }

  const saveField = async () => {
    if (!editingField) return
    setSaving(true)
    try {
      const body = {}
      body[editingField] = editValue

      const res = await fetch(apiEndpoint(`/users/${user.id}`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const json = await res.json()

      if (json.success) {
        setLocalOverrides(prev => ({ ...prev, [editingField]: editValue }))
        addToast('Updated', 'success')
        setEditingField(null)
        setEditValue('')
      } else {
        addToast(json.message || 'Failed to update', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveField()
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
          <Avatar name={user?.name} size="lg" />
          <div>
            <div style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colours.neutral[900],
            }}>
              {getValue('display_name') || user?.name}
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
                    marginBottom: '2px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {field.label}
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{
                          flex: 1,
                          background: 'none',
                          border: 'none',
                          borderBottom: `2px solid ${colours.neutral[900]}`,
                          color: colours.neutral[900],
                          fontSize: typography.fontSize.base,
                          fontFamily: 'inherit',
                          padding: '2px 0',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); saveField() }}
                        disabled={saving}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: colours.neutral[900],
                          padding: '4px',
                          display: 'flex',
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); cancelEditing() }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: colours.neutral[500],
                          padding: '4px',
                          display: 'flex',
                        }}
                      >
                        <X size={16} />
                      </button>
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
