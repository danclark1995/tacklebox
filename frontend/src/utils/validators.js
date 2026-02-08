/**
 * Validation Utilities
 *
 * Client + server validation rules from Section 18 of the spec.
 * Shared validation logic — used by forms and API.
 */

import { VALIDATION } from '@/config/constants'

export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email) && email.length <= VALIDATION.EMAIL_MAX_LENGTH
}

export function isValidPassword(password) {
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  return true
}

export function isValidTaskTitle(title) {
  if (!title) return false
  const len = title.trim().length
  return len >= VALIDATION.TASK_TITLE_MIN && len <= VALIDATION.TASK_TITLE_MAX
}

export function isValidTaskDescription(description) {
  if (!description) return false
  return description.trim().length >= VALIDATION.TASK_DESCRIPTION_MIN
}

export function isValidComment(comment) {
  if (!comment) return false
  const len = comment.trim().length
  return len >= VALIDATION.COMMENT_MIN && len <= VALIDATION.COMMENT_MAX
}

export function isValidTimeDescription(description) {
  if (!description) return false
  const len = description.trim().length
  return len >= VALIDATION.TIME_DESCRIPTION_MIN && len <= VALIDATION.TIME_DESCRIPTION_MAX
}

export function isValidTimeDuration(minutes) {
  return (
    Number.isInteger(minutes) &&
    minutes >= VALIDATION.TIME_DURATION_MIN &&
    minutes <= VALIDATION.TIME_DURATION_MAX &&
    minutes % 15 === 0
  )
}

export function sanitizeString(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
