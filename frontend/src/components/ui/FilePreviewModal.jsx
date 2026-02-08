import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, typography, radii } from '@/config/tokens'
import { formatFileSize } from '@/utils/formatters'
import Modal from './Modal'
import Button from './Button'

const getPreviewUrl = (file) => {
  if (file && file.file_path) {
    return `/api/v1/storage/preview/${encodeURIComponent(file.file_path)}`
  }
  return null
}

const getFileExtension = (fileName) => {
  if (!fileName) return ''
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : ''
}

const isImage = (fileType) => fileType && fileType.includes('image/')
const isPdf = (fileType) => fileType && fileType.includes('pdf')

const FilePreviewModal = ({ file, isOpen, onClose }) => {
  if (!file) return null

  const url = getPreviewUrl(file)

  const handleDownload = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const renderContent = () => {
    if (isImage(file.file_type)) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img
            src={url}
            alt={file.file_name}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: radii.md,
            }}
          />
        </div>
      )
    }

    if (isPdf(file.file_type)) {
      return (
        <iframe
          src={url}
          title={file.file_name}
          style={{
            width: '100%',
            height: '80vh',
            border: 'none',
            borderRadius: radii.md,
          }}
        />
      )
    }

    // Other file types: show file info
    const extension = getFileExtension(file.file_name)

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[8],
          gap: spacing[4],
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colours.neutral[400]}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: typography.fontFamily.sans,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.medium,
              color: colours.neutral[900],
              margin: `0 0 ${spacing[2]} 0`,
            }}
          >
            {file.file_name}
          </p>
          {extension && (
            <p
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.sm,
                color: colours.neutral[500],
                margin: `0 0 ${spacing[1]} 0`,
              }}
            >
              File type: {extension}
            </p>
          )}
          {file.file_size != null && (
            <p
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.sm,
                color: colours.neutral[500],
                margin: 0,
              }}
            >
              Size: {formatFileSize(file.file_size)}
            </p>
          )}
        </div>
        <Button variant="primary" onClick={handleDownload}>
          Download File
        </Button>
      </div>
    )
  }

  const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing[3],
    paddingTop: spacing[4],
    borderTop: `1px solid ${colours.neutral[200]}`,
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={file.file_name} size="lg">
      {renderContent()}
      <div style={footerStyle}>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleDownload}>
          Download
        </Button>
      </div>
    </Modal>
  )
}

FilePreviewModal.propTypes = {
  file: PropTypes.shape({
    file_name: PropTypes.string.isRequired,
    file_path: PropTypes.string,
    file_type: PropTypes.string,
    file_size: PropTypes.number,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default FilePreviewModal
