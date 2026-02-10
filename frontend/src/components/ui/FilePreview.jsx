import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { colours, radii, typography, transitions, shadows, spacing } from '@/config/tokens'
import { formatFileSize } from '@/utils/formatters'

const sizeMap = {
  thumbnail: { width: '80px', height: '80px', maxWidth: '80px' },
  medium: { width: '200px', height: '200px', maxWidth: '200px' },
  large: { width: '100%', height: '400px', maxWidth: '100%' },
}

const getPreviewUrl = (file, previewUrl) => {
  if (previewUrl) return previewUrl
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

const PdfIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colours.white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const FileIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colours.neutral[500]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

const FilePreview = ({
  file,
  previewUrl,
  size = 'thumbnail',
  onClick,
  showName = true,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false)

  if (!file) return null

  const url = getPreviewUrl(file, previewUrl)
  const dimensions = sizeMap[size] || sizeMap.thumbnail
  const extension = getFileExtension(file.file_name)

  const containerStyle = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[1],
    cursor: onClick ? 'pointer' : 'default',
  }

  const previewBoxStyle = {
    width: dimensions.width,
    height: dimensions.height,
    maxWidth: dimensions.maxWidth,
    borderRadius: radii.md,
    overflow: 'hidden',
    border: `1px solid ${colours.neutral[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: `box-shadow ${transitions.fast}`,
    boxShadow: isHovered && onClick ? shadows.md : shadows.none,
  }

  const nameStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    color: colours.neutral[600],
    maxWidth: dimensions.width,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  }

  const placeholderTextStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing[1],
  }

  const handleClick = () => {
    if (onClick) onClick(file)
  }

  const renderPreview = () => {
    if (isImage(file.file_type)) {
      return (
        <img
          src={url}
          alt={file.file_name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )
    }

    if (isPdf(file.file_type)) {
      if (size === 'large') {
        return (
          <iframe
            src={url}
            title={file.file_name}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        )
      }

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colours.neutral[700],
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PdfIcon />
          <span style={{ ...placeholderTextStyle, color: colours.white }}>PDF</span>
        </div>
      )
    }

    // Generic file type
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colours.neutral[100],
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FileIcon />
        {extension && (
          <span style={{ ...placeholderTextStyle, color: colours.neutral[500] }}>
            {extension}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      style={containerStyle}
      className={className}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() } : undefined}
    >
      <div style={previewBoxStyle}>
        {renderPreview()}
      </div>
      {showName && (
        <span style={nameStyle} title={file.file_name}>
          {file.file_name}
          {file.file_size != null && (
            <span style={{ color: colours.neutral[400], marginLeft: spacing[1] }}>
              ({formatFileSize(file.file_size)})
            </span>
          )}
        </span>
      )}
    </div>
  )
}

FilePreview.propTypes = {
  file: PropTypes.shape({
    file_name: PropTypes.string.isRequired,
    file_path: PropTypes.string,
    file_type: PropTypes.string,
    file_size: PropTypes.number,
  }),
  previewUrl: PropTypes.string,
  size: PropTypes.oneOf(['thumbnail', 'medium', 'large']),
  onClick: PropTypes.func,
  showName: PropTypes.bool,
  className: PropTypes.string,
}

export default FilePreview
