import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography, transitions } from '@/config/tokens'

const FileUpload = ({
  onFilesSelected,
  accept = '*',
  multiple = false,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB
  disabled = false,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const validateFiles = (files) => {
    const fileArray = Array.from(files)
    setError('')

    if (!multiple && fileArray.length > 1) {
      setError('Only one file allowed')
      return []
    }

    if (fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return []
    }

    const validFiles = fileArray.filter((file) => {
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds maximum size of ${(maxSize / (1024 * 1024)).toFixed(0)}MB`)
        return false
      }
      return true
    })

    return validFiles
  }

  const handleFiles = (files) => {
    const validFiles = validateFiles(files)
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      if (onFilesSelected) {
        onFilesSelected(validFiles)
      }
    }
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!disabled) {
      const files = e.dataTransfer.files
      handleFiles(files)
    }
  }

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  const handleChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  const dropZoneStyles = {
    fontFamily: typography.fontFamily.sans,
    border: `2px dashed ${isDragging ? colours.primary[500] : colours.neutral[300]}`,
    borderRadius: radii.lg,
    padding: spacing[8],
    textAlign: 'center',
    backgroundColor: isDragging ? colours.primary[50] : disabled ? colours.neutral[50] : colours.white,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `all ${transitions.normal}`,
  }

  const iconStyles = {
    fontSize: typography.fontSize['2xl'],
    color: colours.neutral[400],
    marginBottom: spacing[2],
  }

  const textStyles = {
    fontSize: typography.fontSize.base,
    color: colours.neutral[700],
    marginBottom: spacing[1],
  }

  const subTextStyles = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[500],
  }

  const fileListStyles = {
    marginTop: spacing[4],
    textAlign: 'left',
  }

  const fileItemStyles = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[700],
    padding: spacing[2],
    backgroundColor: colours.neutral[50],
    borderRadius: radii.sm,
    marginBottom: spacing[2],
  }

  const errorStyles = {
    fontSize: typography.fontSize.sm,
    color: colours.error[500],
    marginTop: spacing[2],
  }

  return (
    <div className={className}>
      <div
        style={dropZoneStyles}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div style={iconStyles}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto', display: 'block' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div style={textStyles}>Drop files here or click to browse</div>
        <div style={subTextStyles}>
          {multiple ? `Up to ${maxFiles} files` : 'Single file only'}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />
      </div>

      {selectedFiles.length > 0 && (
        <div style={fileListStyles}>
          {selectedFiles.map((file, index) => (
            <div key={index} style={fileItemStyles}>
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          ))}
        </div>
      )}

      {error && <div style={errorStyles}>{error}</div>}
    </div>
  )
}

FileUpload.propTypes = {
  onFilesSelected: PropTypes.func,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  maxFiles: PropTypes.number,
  maxSize: PropTypes.number,
  disabled: PropTypes.bool,
  className: PropTypes.string,
}

export default FileUpload
