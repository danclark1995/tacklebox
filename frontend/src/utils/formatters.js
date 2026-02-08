/**
 * Formatting Utilities
 *
 * Consistent display formatting across the app.
 */

/**
 * Format a date string for display
 * @param {string} dateStr - ISO date string
 * @param {object} options - Intl.DateTimeFormat options
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/**
 * Format a date with time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format minutes into hours:minutes display
 * @param {number} minutes
 * @returns {string} e.g., "2:30"
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0:00'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${String(mins).padStart(2, '0')}`
}

/**
 * Format file size in human-readable form
 * @param {number} bytes
 * @returns {string} e.g., "1.5 MB"
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '...'
}

/**
 * Get initials from a display name
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
