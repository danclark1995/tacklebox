import { useState } from 'react'
import { HelpCircle, Send, Check } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Avatar from '@/components/ui/Avatar'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function ClientProfile() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [company, setCompany] = useState(user?.company || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(apiEndpoint(`/users/${user.id}`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          display_name: displayName,
          company
        })
      })

      const json = await res.json()

      if (json.success) {
        addToast('Profile updated successfully', 'success')
        setIsEditing(false)
      } else {
        addToast(json.message || 'Failed to update profile', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const cardStyle = {
    padding: spacing[6],
    maxWidth: '600px',
  }

  const profileHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[6],
  }

  const fieldStyle = {
    marginBottom: spacing[4],
  }

  const labelStyle = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[700],
    marginBottom: spacing[2],
  }

  const valueStyle = {
    fontSize: typography.fontSize.base,
    color: colours.neutral[900],
  }

  const actionsStyle = {
    marginTop: spacing[6],
  }

  return (
    <div>
      <PageHeader title="Profile" />

      <GlowCard style={cardStyle}>
        <div style={profileHeaderStyle}>
          <Avatar name={user?.display_name} size="lg" />
          <div>
            <div style={{ ...valueStyle, fontWeight: typography.fontWeight.semibold }}>
              {user?.display_name}
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600] }}>
              {user?.email}
            </div>
          </div>
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>Display Name</div>
          <div style={valueStyle}>{user?.display_name}</div>
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>Email</div>
          <div style={valueStyle}>{user?.email}</div>
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>Company</div>
          <div style={valueStyle}>{user?.company || 'Not set'}</div>
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>Role</div>
          <div style={valueStyle}>{user?.role}</div>
        </div>

        <div style={actionsStyle}>
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        </div>
      </GlowCard>

      {/* Contact Support */}
      <ContactSupport />

      {isEditing && (
        <Modal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          title="Edit Profile"
        >
          <div style={{ padding: spacing[4] }}>
            <div style={fieldStyle}>
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>

            <div style={fieldStyle}>
              <Input
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter your company name"
              />
            </div>

            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end', marginTop: spacing[6] }}>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ContactSupport() {
  const { addToast } = useToast()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return
    setSending(true)
    try {
      const res = await fetch(apiEndpoint('/support'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setSent(true)
        setSubject('')
        setMessage('')
      } else {
        addToast(json.error || 'Failed to send message', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ marginTop: spacing[6], maxWidth: '600px' }}>
      <h2 style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colours.neutral[900],
        marginBottom: spacing[4],
      }}>
        <HelpCircle size={18} />
        Contact Support
      </h2>

      <GlowCard style={{ padding: spacing[6] }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: spacing[6] }}>
            <Check size={32} style={{ color: colours.neutral[900], marginBottom: spacing[3] }} />
            <div style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colours.neutral[900],
              marginBottom: spacing[2],
            }}>
              Message sent!
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600], marginBottom: spacing[4] }}>
              We'll get back to you shortly.
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSent(false)}>
              Send Another
            </Button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: spacing[4] }}>
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What do you need help with?"
              />
            </div>
            <div style={{ marginBottom: spacing[4] }}>
              <Textarea
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                rows={3}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={sending || !subject.trim() || !message.trim()}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Send size={14} />
                {sending ? 'Sending...' : 'Send Message'}
              </span>
            </Button>
          </div>
        )}
      </GlowCard>
    </div>
  )
}
