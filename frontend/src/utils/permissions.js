/**
 * Permission Utilities
 *
 * Role-based permission checks from Section 5 of the spec.
 * Used by both frontend (conditional rendering) and middleware (route guards).
 */

import { ROLES, TASK_TRANSITION_ROLES } from '@/config/constants'

const PERMISSIONS = {
  'view_own_tasks':       [ROLES.CLIENT, ROLES.CONTRACTOR, ROLES.ADMIN],
  'view_all_tasks':       [ROLES.ADMIN],
  'submit_task':          [ROLES.CLIENT, ROLES.ADMIN],
  'update_task_status':   [ROLES.CONTRACTOR, ROLES.ADMIN],
  'assign_tasks':         [ROLES.ADMIN],
  'upload_deliverables':  [ROLES.CONTRACTOR, ROLES.ADMIN],
  'add_comments':         [ROLES.CLIENT, ROLES.CONTRACTOR, ROLES.ADMIN],
  'log_time':             [ROLES.CONTRACTOR, ROLES.ADMIN],
  'complete_review':      [ROLES.CONTRACTOR, ROLES.ADMIN],
  'view_reviews':         [ROLES.CONTRACTOR, ROLES.ADMIN],
  'view_brand_profile':   [ROLES.CLIENT, ROLES.CONTRACTOR, ROLES.ADMIN],
  'edit_brand_profile':   [ROLES.ADMIN],
  'view_brand_guides':    [ROLES.CLIENT, ROLES.CONTRACTOR, ROLES.ADMIN],
  'upload_brand_guides':  [ROLES.ADMIN],
  'view_own_projects':    [ROLES.CLIENT, ROLES.ADMIN],
  'manage_categories':    [ROLES.ADMIN],
  'manage_templates':     [ROLES.ADMIN],
  'view_gamification':    [ROLES.CONTRACTOR, ROLES.ADMIN],
  'view_analytics':       [ROLES.ADMIN],
  'manage_users':         [ROLES.ADMIN],
  'use_search':           [ROLES.CLIENT, ROLES.CONTRACTOR, ROLES.ADMIN],
}

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission key
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const allowed = PERMISSIONS[permission]
  if (!allowed) return false
  return allowed.includes(role)
}

/**
 * Get all permissions for a role
 * @param {string} role
 * @returns {string[]}
 */
export function getPermissions(role) {
  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([perm]) => perm)
}

/**
 * Check if user can perform a task status transition
 */
export function canTransitionTask(role, fromStatus, toStatus) {
  const key = `${fromStatus}->${toStatus}`
  const allowed = TASK_TRANSITION_ROLES[key]
  return allowed ? allowed.includes(role) : false
}
