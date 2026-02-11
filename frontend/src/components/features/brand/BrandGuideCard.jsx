import { GlowCard, Button } from '@/components/ui'
import { FileText, Paperclip } from 'lucide-react'
import { formatDateTime } from '@/utils/formatters'
import { colours, spacing } from '@/config/tokens'
import useAuth from '@/hooks/useAuth'

/**
 * BrandGuideCard
 *
 * Card for a brand guide document.
 * Shows: thumbnail/icon based on file type, title, upload date, view/download buttons.
 * Delete button for admin only.
 */
export default function BrandGuideCard({ guide, onView, onDelete }) {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('admin')

  if (!guide) return null

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return (
        <div style={{
          width: '100%',
          height: '150px',
          backgroundColor: colours.neutral[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px 8px 0 0',
        }}>
          <FileText size={48} color={colours.neutral[700]} strokeWidth={1.5} />
        </div>
      )
    } else if (fileType.includes('image')) {
      return (
        <img
          src={guide.file_path}
          alt={guide.title}
          style={{
            width: '100%',
            height: '150px',
            objectFit: 'cover',
            borderRadius: '8px 8px 0 0',
          }}
        />
      )
    } else {
      return (
        <div style={{
          width: '100%',
          height: '150px',
          backgroundColor: colours.neutral[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px 8px 0 0',
        }}>
          <Paperclip size={48} color={colours.neutral[500]} strokeWidth={1.5} />
        </div>
      )
    }
  }

  return (
    <GlowCard
      className="brand-guide-card"
      glowOnHover
      padding="0"
      style={{ overflow: 'hidden' }}
    >
      {/* Thumbnail/Icon */}
      {getFileIcon(guide.file_type)}

      {/* Content */}
      <div style={{ padding: spacing[4] }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: colours.neutral[900],
          marginBottom: spacing[2],
          lineHeight: 1.3,
        }}>
          {guide.title}
        </h3>

        <div style={{
          fontSize: '13px',
          color: colours.neutral[600],
          marginBottom: spacing[4],
        }}>
          Uploaded {formatDateTime(guide.created_at)}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: spacing[2],
          flexWrap: 'wrap',
        }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onView && onView(guide)}
            style={{ flex: 1 }}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(guide.file_path, '_blank')}
            style={{ flex: 1 }}
          >
            Download
          </Button>
          {isAdmin && onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this brand guide?')) {
                  onDelete(guide)
                }
              }}
              style={{ flex: '0 0 auto' }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </GlowCard>
  )
}
