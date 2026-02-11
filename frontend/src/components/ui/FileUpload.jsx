import React, { useState, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { File, FileText, Image as ImageIcon, Video, Music, Archive, Table, Monitor } from 'lucide-react'
import { colours, spacing, radii, typography, transitions } from '@/config/tokens'
import WaveProgressBar from './WaveProgressBar'

const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB
const CHUNKED_THRESHOLD = 100 * 1024 * 1024 // 100MB

/**
 * Format file size in human-readable MB.
 */
const formatFileSize = (size) => `${(size / 1024 / 1024).toFixed(2)} MB`

/**
 * Return a simple icon character based on MIME type.
 */
const getFileTypeIcon = (mimeType) => {
  const iconProps = { size: 16, strokeWidth: 1.5 }
  if (!mimeType) return <File {...iconProps} />
  if (mimeType.startsWith('image/')) return <ImageIcon {...iconProps} />
  if (mimeType.startsWith('video/')) return <Video {...iconProps} />
  if (mimeType.startsWith('audio/')) return <Music {...iconProps} />
  if (mimeType.includes('pdf')) return <FileText {...iconProps} />
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) return <Archive {...iconProps} />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <Table {...iconProps} />
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Monitor {...iconProps} />
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) return <FileText {...iconProps} />
  return <File {...iconProps} />
}

const FileUpload = ({
  onFilesSelected,
  onUpload,
  onCancel,
  accept = '*',
  multiple = false,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB
  disabled = false,
  className = '',
  showUploadButton = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [fileEntries, setFileEntries] = useState([])
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const abortControllersRef = useRef({})

  // Generate a unique ID for each file entry
  const makeId = useCallback(() => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, [])

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

  /**
   * Upload a single file. Handles chunked upload for large files.
   * Calls onUpload(file, { onProgress, signal }).
   */
  const uploadFile = useCallback(
    async (entry) => {
      if (!onUpload) return

      const controller = new AbortController()
      abortControllersRef.current[entry.id] = controller

      setFileEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, status: 'uploading', progress: 0 } : e)),
      )

      const onProgress = (loaded, total) => {
        const pct = total > 0 ? Math.round((loaded / total) * 100) : 0
        setFileEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, progress: pct } : e)),
        )
      }

      try {
        if (entry.file.size > CHUNKED_THRESHOLD) {
          // Chunked upload
          const totalSize = entry.file.size
          const totalChunks = Math.ceil(totalSize / CHUNK_SIZE)
          let uploadedBytes = 0

          for (let i = 0; i < totalChunks; i++) {
            if (controller.signal.aborted) {
              throw new DOMException('Upload cancelled', 'AbortError')
            }

            const start = i * CHUNK_SIZE
            const end = Math.min(start + CHUNK_SIZE, totalSize)
            const chunk = entry.file.slice(start, end)

            // Create a synthetic file-like object for the chunk
            const chunkFile = new File([chunk], entry.file.name, { type: entry.file.type })
            chunkFile._chunkIndex = i
            chunkFile._totalChunks = totalChunks
            chunkFile._originalSize = totalSize

            await onUpload(chunkFile, {
              onProgress: (chunkLoaded, chunkTotal) => {
                const overall = uploadedBytes + chunkLoaded
                onProgress(overall, totalSize)
              },
              signal: controller.signal,
            })

            uploadedBytes += (end - start)
            onProgress(uploadedBytes, totalSize)
          }
        } else {
          // Single upload
          await onUpload(entry.file, { onProgress, signal: controller.signal })
        }

        // If we reach here, upload succeeded
        if (!controller.signal.aborted) {
          setFileEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? { ...e, status: 'complete', progress: 100 } : e)),
          )
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          setFileEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? { ...e, status: 'cancelled' } : e)),
          )
        } else {
          setFileEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? { ...e, status: 'error', errorMessage: err.message } : e)),
          )
        }
      } finally {
        delete abortControllersRef.current[entry.id]
      }
    },
    [onUpload],
  )

  /**
   * Start uploads for all pending entries.
   */
  const startUploads = useCallback(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.status === 'pending') {
          uploadFile(entry)
        }
      })
    },
    [uploadFile],
  )

  const handleFiles = (files) => {
    const validFiles = validateFiles(files)
    if (validFiles.length > 0) {
      const newEntries = validFiles.map((file) => ({
        id: makeId(),
        file,
        status: 'pending',
        progress: 0,
        errorMessage: null,
      }))

      setFileEntries((prev) => {
        const updated = [...prev, ...newEntries]
        return updated
      })

      if (onFilesSelected) {
        onFilesSelected(validFiles)
      }

      // Auto-upload if showUploadButton is false and onUpload is provided
      if (!showUploadButton && onUpload) {
        // Use setTimeout to allow state to update before starting uploads
        setTimeout(() => startUploads(newEntries), 0)
      }
    }
  }

  /**
   * Handle the explicit "Upload" button click.
   */
  const handleUploadClick = () => {
    const pendingEntries = fileEntries.filter((e) => e.status === 'pending')
    startUploads(pendingEntries)
  }

  /**
   * Remove a file from the selection (only before upload starts).
   */
  const removeFile = (id) => {
    setFileEntries((prev) => prev.filter((e) => e.id !== id))
  }

  /**
   * Cancel an in-progress upload.
   */
  const cancelUpload = (entry) => {
    const controller = abortControllersRef.current[entry.id]
    if (controller) {
      controller.abort()
    }
    setFileEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, status: 'cancelled' } : e)),
    )
    if (onCancel) {
      onCancel(entry.file)
    }
  }

  // --- Drag and drop handlers ---

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
    // Reset input so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // --- Status colour helpers ---

  const getStatusColour = (status) => {
    switch (status) {
      case 'uploading':
        return colours.neutral[900]
      case 'complete':
        return colours.neutral[700]
      case 'error':
      case 'cancelled':
        return colours.neutral[500]
      default:
        return colours.neutral[400]
    }
  }

  const getStatusLabel = (entry) => {
    switch (entry.status) {
      case 'pending':
        return 'Pending'
      case 'uploading':
        return `${entry.progress}%`
      case 'complete':
        return 'Complete'
      case 'error':
        return entry.errorMessage || 'Error'
      case 'cancelled':
        return 'Cancelled'
      default:
        return ''
    }
  }

  // --- Styles ---

  const dropZoneStyles = {
    fontFamily: typography.fontFamily.sans,
    border: `2px dashed ${isDragging ? colours.neutral[900] : colours.neutral[300]}`,
    borderRadius: radii.lg,
    padding: spacing[8],
    textAlign: 'center',
    backgroundColor: isDragging ? colours.neutral[100] : disabled ? colours.neutral[50] : colours.white,
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
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colours.neutral[700],
    padding: spacing[3],
    backgroundColor: colours.neutral[50],
    borderRadius: radii.md,
    marginBottom: spacing[2],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    transition: `all ${transitions.normal}`,
  }

  const fileItemRowStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  }

  const fileIconStyles = {
    fontSize: typography.fontSize.lg,
    flexShrink: 0,
    lineHeight: 1,
  }

  const fileNameStyles = {
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const fileSizeStyles = {
    fontSize: typography.fontSize.xs,
    color: colours.neutral[500],
    flexShrink: 0,
  }

  const statusLabelStyles = (status) => ({
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: getStatusColour(status),
    flexShrink: 0,
  })

  const actionButtonStyles = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: spacing[1],
    borderRadius: radii.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: `background-color ${transitions.fast}`,
    color: colours.neutral[400],
    lineHeight: 1,
  }

  const uploadButtonStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.white,
    backgroundColor: colours.neutral[900],
    border: 'none',
    borderRadius: radii.md,
    padding: `${spacing[2]} ${spacing[4]}`,
    cursor: 'pointer',
    marginTop: spacing[3],
    transition: `background-color ${transitions.fast}`,
  }

  const errorStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colours.neutral[700],
    marginTop: spacing[2],
  }

  // --- SVG icons ---

  const CheckIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={colours.neutral[700]}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )

  const XIcon = ({ colour: iconColour = colours.neutral[400], size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={iconColour}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )

  XIcon.propTypes = {
    colour: PropTypes.string,
    size: PropTypes.number,
  }

  // --- Determine if there are pending files that can be uploaded ---
  const hasPendingFiles = fileEntries.some((e) => e.status === 'pending')

  return (
    <div className={className}>
      {/* Drop zone */}
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

      {/* File list */}
      {fileEntries.length > 0 && (
        <div style={fileListStyles}>
          {fileEntries.map((entry) => (
            <div key={entry.id} style={fileItemStyles}>
              {/* Top row: icon, name, size, status, action button */}
              <div style={fileItemRowStyles}>
                <span style={fileIconStyles}>{getFileTypeIcon(entry.file.type)}</span>
                <span style={fileNameStyles} title={entry.file.name}>
                  {entry.file.name}
                </span>
                <span style={fileSizeStyles}>{formatFileSize(entry.file.size)}</span>
                <span style={statusLabelStyles(entry.status)}>{getStatusLabel(entry)}</span>

                {/* Status icon or action button */}
                {entry.status === 'complete' && <CheckIcon />}

                {(entry.status === 'error' || entry.status === 'cancelled') && (
                  <XIcon colour={colours.neutral[500]} />
                )}

                {entry.status === 'pending' && (
                  <button
                    type="button"
                    style={actionButtonStyles}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(entry.id)
                    }}
                    title="Remove file"
                    aria-label={`Remove ${entry.file.name}`}
                  >
                    <XIcon />
                  </button>
                )}

                {entry.status === 'uploading' && (
                  <button
                    type="button"
                    style={actionButtonStyles}
                    onClick={(e) => {
                      e.stopPropagation()
                      cancelUpload(entry)
                    }}
                    title="Cancel upload"
                    aria-label={`Cancel upload of ${entry.file.name}`}
                  >
                    <XIcon colour={colours.neutral[500]} />
                  </button>
                )}
              </div>

              {/* Progress bar — shown during upload */}
              {entry.status === 'uploading' && (
                <WaveProgressBar progress={entry.progress} size="sm" />
              )}

              {/* Completed progress bar — full */}
              {entry.status === 'complete' && (
                <WaveProgressBar progress={100} size="sm" />
              )}
            </div>
          ))}

          {/* Explicit upload button */}
          {showUploadButton && hasPendingFiles && onUpload && (
            <button
              type="button"
              style={uploadButtonStyles}
              onClick={handleUploadClick}
              disabled={disabled}
            >
              Upload {fileEntries.filter((e) => e.status === 'pending').length} file
              {fileEntries.filter((e) => e.status === 'pending').length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && <div style={errorStyles}>{error}</div>}
    </div>
  )
}

FileUpload.propTypes = {
  /** Called with array of selected File objects */
  onFilesSelected: PropTypes.func,
  /** Called with (file, { onProgress, signal }) to perform the upload */
  onUpload: PropTypes.func,
  /** Called with the File when an upload is cancelled */
  onCancel: PropTypes.func,
  /** File type filter for the input element */
  accept: PropTypes.string,
  /** Allow selecting multiple files */
  multiple: PropTypes.bool,
  /** Maximum number of files allowed */
  maxFiles: PropTypes.number,
  /** Maximum file size in bytes (default 5GB) */
  maxSize: PropTypes.number,
  /** Disable the upload component */
  disabled: PropTypes.bool,
  /** Additional CSS class name */
  className: PropTypes.string,
  /** If true, show an explicit Upload button instead of auto-uploading on selection */
  showUploadButton: PropTypes.bool,
}

export default FileUpload
