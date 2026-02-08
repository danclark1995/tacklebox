/**
 * Storage Service — R2 Abstraction Layer
 *
 * All file operations go through this service.
 * Abstracts R2 so the provider can be swapped without touching UI.
 *
 * Supports: upload, download, delete, presigned URLs.
 * Phase 1C adds chunked/multipart for large files.
 */

import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from './auth'
import { MAX_FILE_SIZE_BYTES, MAX_FILES_PER_UPLOAD, FILE_UPLOAD_TIMEOUT_MS } from '@/config/constants'

/**
 * Upload a single file
 * @param {File} file - File object
 * @param {string} type - Upload context ('attachment', 'deliverable', 'brand-guide', 'avatar', 'logo')
 * @param {object} metadata - Additional metadata (taskId, clientId, etc.)
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<object>} Upload result with file_path, file_name, file_size, file_type
 */
export async function uploadFile(file, type, metadata = {}, onProgress = null) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File exceeds maximum size of 5 GB`)
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  Object.entries(metadata).forEach(([key, value]) => {
    formData.append(key, value)
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FILE_UPLOAD_TIMEOUT_MS)

  try {
    const res = await fetch(apiEndpoint('/storage/upload'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Upload failed')
    return data.data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') throw new Error('Upload timed out')
    throw err
  }
}

/**
 * Upload multiple files
 * @param {FileList|File[]} files
 * @param {string} type
 * @param {object} metadata
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<object[]>} Array of upload results
 */
export async function uploadFiles(files, type, metadata = {}, onProgress = null) {
  const fileArray = Array.from(files)
  if (fileArray.length > MAX_FILES_PER_UPLOAD) {
    throw new Error(`Maximum ${MAX_FILES_PER_UPLOAD} files per upload`)
  }

  const results = []
  for (let i = 0; i < fileArray.length; i++) {
    const result = await uploadFile(fileArray[i], type, metadata, (pct) => {
      if (onProgress) {
        const overallProgress = ((i + pct / 100) / fileArray.length) * 100
        onProgress(Math.round(overallProgress))
      }
    })
    results.push(result)
  }
  return results
}

/**
 * Get a download URL for a file
 * @param {string} filePath - R2 key
 * @returns {string} Download URL
 */
export function getDownloadUrl(filePath) {
  return apiEndpoint(`/storage/download/${encodeURIComponent(filePath)}`)
}

/**
 * Get a preview URL for a file (images/PDFs)
 * @param {string} filePath - R2 key
 * @returns {string} Preview URL
 */
export function getPreviewUrl(filePath) {
  return apiEndpoint(`/storage/preview/${encodeURIComponent(filePath)}`)
}

/**
 * Delete a file
 * @param {string} filePath - R2 key
 */
export async function deleteFile(filePath) {
  const res = await fetch(apiEndpoint(`/storage/delete/${encodeURIComponent(filePath)}`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Delete failed')
  return data.data
}

const storageService = {
  uploadFile,
  uploadFiles,
  getDownloadUrl,
  getPreviewUrl,
  deleteFile,
}

export default storageService
