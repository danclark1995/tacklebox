import { useState } from 'react'
import PropTypes from 'prop-types'
import { FilePreview, FilePreviewModal, FileUpload, Button, EmptyState } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import { TASK_STATUSES } from '@/config/constants'
import { formatDateTime, formatFileSize } from '@/utils/formatters'
import { colours, spacing, radii, typography, shadows } from '@/config/tokens'

/**
 * AttachmentList
 *
 * Enhanced attachment list with file previews for task detail view.
 * Groups attachments by upload_type: "Submission Files" and "Deliverables".
 * Supports thumbnail preview, full-size preview modal, download, delete, and upload.
 */

// ── Icons ────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function PaperclipIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

// ── Styles ───────────────────────────────────────────────────────────

const sectionHeaderStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[800],
  margin: 0,
  marginBottom: spacing[4],
  paddingBottom: spacing[2],
  borderBottom: `2px solid ${colours.neutral[100]}`,
}

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: spacing[4],
}

const attachmentCardStyles = {
  backgroundColor: colours.white,
  border: `1px solid ${colours.neutral[200]}`,
  borderRadius: radii.lg,
  overflow: 'hidden',
  boxShadow: shadows.sm,
  display: 'flex',
  flexDirection: 'column',
}

const thumbnailWrapperStyles = {
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colours.neutral[50],
  minHeight: '140px',
  padding: spacing[2],
  overflow: 'hidden',
}

const infoStyles = {
  padding: spacing[3],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
  flex: 1,
}

const fileNameStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colours.neutral[900],
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const fileMetaStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.xs,
  color: colours.neutral[500],
  lineHeight: typography.lineHeight.normal,
}

const actionsRowStyles = {
  display: 'flex',
  gap: spacing[2],
  padding: `0 ${spacing[3]} ${spacing[3]}`,
}

const iconBtnStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[1],
  background: 'none',
  border: `1px solid ${colours.neutral[200]}`,
  borderRadius: radii.sm,
  padding: `${spacing[1]} ${spacing[2]}`,
  cursor: 'pointer',
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.xs,
  color: colours.neutral[600],
  transition: 'background-color 150ms ease',
}

// ── Attachment Card ──────────────────────────────────────────────────

function AttachmentCard({ attachment, canDelete, onDelete, onPreview }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(attachment.id)
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
    }
  }

  const downloadUrl = `/api/v1/storage/download/${attachment.id}`

  return (
    <div style={attachmentCardStyles}>
      {/* Thumbnail */}
      <div
        style={thumbnailWrapperStyles}
        onClick={() => onPreview(attachment)}
        title="Click to preview"
      >
        <FilePreview
          fileName={attachment.file_name}
          filePath={attachment.file_path}
          fileType={attachment.file_type}
          size="thumbnail"
        />
      </div>

      {/* Info */}
      <div style={infoStyles}>
        <div style={fileNameStyles} title={attachment.file_name}>
          {attachment.file_name}
        </div>
        <div style={fileMetaStyles}>
          {formatFileSize(attachment.file_size)}
        </div>
        <div style={fileMetaStyles}>
          {formatDateTime(attachment.created_at)}
        </div>
        <div style={fileMetaStyles}>
          Uploaded by {attachment.uploader_name}
        </div>
      </div>

      {/* Actions */}
      <div style={actionsRowStyles}>
        <a
          href={downloadUrl}
          download
          style={{ ...iconBtnStyles, textDecoration: 'none' }}
          title="Download file"
        >
          <DownloadIcon />
          <span>Download</span>
        </a>

        {canDelete && (
          <Button
            variant={confirmDelete ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            title={confirmDelete ? 'Click again to confirm' : 'Delete file'}
            icon={<TrashIcon />}
          >
            {confirmDelete ? 'Confirm' : 'Delete'}
          </Button>
        )}
      </div>
    </div>
  )
}

AttachmentCard.propTypes = {
  attachment: PropTypes.object.isRequired,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
}

// ── Main Component ───────────────────────────────────────────────────

export default function AttachmentList({
  attachments = [],
  onDelete,
  onUpload,
  taskStatus,
  loading = false,
}) {
  const { user, hasRole } = useAuth()
  const [previewAttachment, setPreviewAttachment] = useState(null)

  const isAdmin = hasRole('admin')
  const isClosed = taskStatus === TASK_STATUSES.CLOSED

  const canDelete = (attachment) => {
    if (isAdmin) return true
    return attachment.uploader_id === user?.id
  }

  const canUpload = (hasRole('contractor', 'admin')) && !isClosed

  const submissions = attachments.filter(a => a.upload_type === 'submission')
  const deliverables = attachments.filter(a => a.upload_type === 'deliverable')

  const handleDelete = (attachmentId) => {
    if (onDelete) {
      onDelete(attachmentId)
    }
  }

  const handleUpload = (files) => {
    if (onUpload) {
      onUpload(files)
    }
  }

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[6],
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmptyState title="Loading attachments..." />
      </div>
    )
  }

  if (attachments.length === 0 && !canUpload) {
    return (
      <EmptyState
        icon={<PaperclipIcon />}
        title="No attachments"
        description="No files have been uploaded for this task."
      />
    )
  }

  return (
    <div style={containerStyles}>
      {/* Submission Files */}
      {submissions.length > 0 && (
        <div>
          <h3 style={sectionHeaderStyles}>Submission Files</h3>
          <div style={gridStyles}>
            {submissions.map(attachment => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                canDelete={canDelete(attachment)}
                onDelete={handleDelete}
                onPreview={setPreviewAttachment}
              />
            ))}
          </div>
        </div>
      )}

      {/* Deliverables */}
      {deliverables.length > 0 && (
        <div>
          <h3 style={sectionHeaderStyles}>Deliverables</h3>
          <div style={gridStyles}>
            {deliverables.map(attachment => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                canDelete={canDelete(attachment)}
                onDelete={handleDelete}
                onPreview={setPreviewAttachment}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no attachments but can upload */}
      {attachments.length === 0 && canUpload && (
        <EmptyState
          icon={<PaperclipIcon />}
          title="No attachments"
          description="Upload files to get started."
        />
      )}

      {/* Upload area */}
      {canUpload && (
        <div style={{
          padding: spacing[5],
          backgroundColor: colours.neutral[50],
          borderRadius: radii.lg,
          border: `1px dashed ${colours.neutral[300]}`,
        }}>
          <FileUpload
            onFilesSelected={(files) => handleUpload(files)}
            multiple
            disabled={loading}
          />
        </div>
      )}

      {/* Full-size preview modal */}
      {previewAttachment && (
        <FilePreviewModal
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          fileName={previewAttachment.file_name}
          filePath={previewAttachment.file_path}
          fileType={previewAttachment.file_type}
        />
      )}
    </div>
  )
}

AttachmentList.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      file_name: PropTypes.string,
      file_path: PropTypes.string,
      file_type: PropTypes.string,
      file_size: PropTypes.number,
      upload_type: PropTypes.string,
      uploader_name: PropTypes.string,
      uploader_id: PropTypes.string,
      created_at: PropTypes.string,
    })
  ),
  onDelete: PropTypes.func,
  onUpload: PropTypes.func,
  taskStatus: PropTypes.string,
  loading: PropTypes.bool,
}
