/**
 * TackleBox Constants
 *
 * All enums, statuses, categories, and configuration values.
 * Single source of truth — never hardcode these values elsewhere.
 */

// ── Task Statuses ──────────────────────────────────────────────────
export const TASK_STATUSES = {
  SUBMITTED: 'submitted',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  REVISION: 'revision',
  APPROVED: 'approved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
}

export const TASK_STATUS_LABELS = {
  [TASK_STATUSES.SUBMITTED]: 'Submitted',
  [TASK_STATUSES.ASSIGNED]: 'Assigned',
  [TASK_STATUSES.IN_PROGRESS]: 'In Progress',
  [TASK_STATUSES.REVIEW]: 'Review',
  [TASK_STATUSES.REVISION]: 'Revision',
  [TASK_STATUSES.APPROVED]: 'Approved',
  [TASK_STATUSES.CLOSED]: 'Closed',
  [TASK_STATUSES.CANCELLED]: 'Cancelled',
}

// Valid task state transitions: { fromStatus: [toStatuses] }
export const TASK_TRANSITIONS = {
  [TASK_STATUSES.SUBMITTED]: [TASK_STATUSES.ASSIGNED, TASK_STATUSES.CANCELLED],
  [TASK_STATUSES.ASSIGNED]: [TASK_STATUSES.IN_PROGRESS, TASK_STATUSES.CANCELLED],
  [TASK_STATUSES.IN_PROGRESS]: [TASK_STATUSES.REVIEW, TASK_STATUSES.CANCELLED],
  [TASK_STATUSES.REVIEW]: [TASK_STATUSES.APPROVED, TASK_STATUSES.REVISION],
  [TASK_STATUSES.REVISION]: [TASK_STATUSES.IN_PROGRESS],
  [TASK_STATUSES.APPROVED]: [TASK_STATUSES.CLOSED],
  [TASK_STATUSES.CLOSED]: [],
  [TASK_STATUSES.CANCELLED]: [],
}

// Who can perform each transition
export const TASK_TRANSITION_ROLES = {
  [`${TASK_STATUSES.SUBMITTED}->${TASK_STATUSES.ASSIGNED}`]: ['admin'],
  [`${TASK_STATUSES.SUBMITTED}->${TASK_STATUSES.CANCELLED}`]: ['admin'],
  [`${TASK_STATUSES.ASSIGNED}->${TASK_STATUSES.IN_PROGRESS}`]: ['contractor'],
  [`${TASK_STATUSES.ASSIGNED}->${TASK_STATUSES.CANCELLED}`]: ['admin'],
  [`${TASK_STATUSES.IN_PROGRESS}->${TASK_STATUSES.REVIEW}`]: ['contractor'],
  [`${TASK_STATUSES.IN_PROGRESS}->${TASK_STATUSES.CANCELLED}`]: ['admin'],
  [`${TASK_STATUSES.REVIEW}->${TASK_STATUSES.APPROVED}`]: ['admin'],
  [`${TASK_STATUSES.REVIEW}->${TASK_STATUSES.REVISION}`]: ['admin'],
  [`${TASK_STATUSES.REVISION}->${TASK_STATUSES.IN_PROGRESS}`]: ['contractor'],
  [`${TASK_STATUSES.APPROVED}->${TASK_STATUSES.CLOSED}`]: ['admin'],
}

// ── Priorities ─────────────────────────────────────────────────────
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
}

export const PRIORITY_LABELS = {
  [PRIORITIES.LOW]: 'Low',
  [PRIORITIES.MEDIUM]: 'Medium',
  [PRIORITIES.HIGH]: 'High',
  [PRIORITIES.URGENT]: 'Urgent',
}

export const PRIORITY_ORDER = [
  PRIORITIES.URGENT,
  PRIORITIES.HIGH,
  PRIORITIES.MEDIUM,
  PRIORITIES.LOW,
]

// ── User Roles ─────────────────────────────────────────────────────
export const ROLES = {
  CLIENT: 'client',
  CONTRACTOR: 'contractor',
  ADMIN: 'admin',
}

export const ROLE_LABELS = {
  [ROLES.CLIENT]: 'Client',
  [ROLES.CONTRACTOR]: 'Camper',
  [ROLES.ADMIN]: 'Admin',
}

// ── Project Statuses ───────────────────────────────────────────────
export const PROJECT_STATUSES = {
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
}

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUSES.ACTIVE]: 'Active',
  [PROJECT_STATUSES.ON_HOLD]: 'On Hold',
  [PROJECT_STATUSES.COMPLETED]: 'Completed',
  [PROJECT_STATUSES.ARCHIVED]: 'Archived',
}

// ── Task Categories (Initial Set) ──────────────────────────────────
export const INITIAL_CATEGORIES = [
  { name: 'Logo Design', description: 'Logo creation and brand mark design', icon: 'palette', default_priority: 'medium' },
  { name: 'Social Media', description: 'Social media graphics, templates, and campaigns', icon: 'share', default_priority: 'medium' },
  { name: 'Brand Strategy', description: 'Brand positioning, messaging, and strategy', icon: 'target', default_priority: 'high' },
  { name: 'Packaging', description: 'Product packaging and label design', icon: 'package', default_priority: 'medium' },
  { name: 'Print Design', description: 'Business cards, brochures, flyers, and print materials', icon: 'printer', default_priority: 'medium' },
  { name: 'Digital Design', description: 'Digital assets, banners, email templates', icon: 'monitor', default_priority: 'medium' },
  { name: 'Illustration', description: 'Custom illustrations and artwork', icon: 'pen-tool', default_priority: 'medium' },
  { name: 'Photography', description: 'Photo editing, retouching, and direction', icon: 'camera', default_priority: 'low' },
  { name: 'Copywriting', description: 'Brand copy, taglines, and written content', icon: 'file-text', default_priority: 'medium' },
  { name: 'Web Design', description: 'Website design, UI/UX, and prototyping', icon: 'layout', default_priority: 'high' },
  { name: 'Other', description: 'Other creative work not listed above', icon: 'more-horizontal', default_priority: 'medium' },
]

// ── Comment Visibility ─────────────────────────────────────────────
export const COMMENT_VISIBILITY = {
  ALL: 'all',
  INTERNAL: 'internal',
}

export const COMMENT_VISIBILITY_LABELS = {
  [COMMENT_VISIBILITY.ALL]: 'Visible to all',
  [COMMENT_VISIBILITY.INTERNAL]: 'Internal only',
}

// ── Upload Types ───────────────────────────────────────────────────
export const UPLOAD_TYPES = {
  SUBMISSION: 'submission',
  DELIVERABLE: 'deliverable',
}

// ── Time Tracking ──────────────────────────────────────────────────
export const TIME_INCREMENT_MINUTES = 15
export const TIME_MAX_MINUTES_PER_ENTRY = 480 // 8 hours

// Generate time duration options: 0:15 to 8:00 in 15-min steps
export const TIME_DURATION_OPTIONS = Array.from(
  { length: TIME_MAX_MINUTES_PER_ENTRY / TIME_INCREMENT_MINUTES },
  (_, i) => {
    const minutes = (i + 1) * TIME_INCREMENT_MINUTES
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return {
      value: minutes,
      label: `${hours}:${String(mins).padStart(2, '0')}`,
    }
  }
)

// ── Review Enums ───────────────────────────────────────────────────
export const REVIEWER_ROLES = {
  CONTRACTOR: 'contractor',
  ADMIN: 'admin',
}

export const TIME_ASSESSMENT = {
  UNDER: 'under',
  ABOUT_RIGHT: 'about_right',
  OVER: 'over',
}

export const TIME_ASSESSMENT_LABELS = {
  [TIME_ASSESSMENT.UNDER]: 'Under estimated time',
  [TIME_ASSESSMENT.ABOUT_RIGHT]: 'About right',
  [TIME_ASSESSMENT.OVER]: 'Over estimated time',
}

export const RATING_MIN = 1
export const RATING_MAX = 5

// ── File Upload ────────────────────────────────────────────────────
export const ALLOWED_FILE_TYPES_ATTACHMENTS = [
  '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg',
  '.ai', '.psd', '.doc', '.docx', '.xls', '.xlsx', '.zip',
]

export const ALLOWED_FILE_TYPES_BRAND_GUIDES = [
  '.pdf', '.png', '.jpg', '.jpeg',
]

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024 // 5 GB
export const MAX_FILES_PER_UPLOAD = 10

// ── Auth Providers ─────────────────────────────────────────────────
export const AUTH_PROVIDERS = {
  LOCAL: 'local',
  // Phase 2: GOOGLE: 'google', APPLE: 'apple'
}

// ── Gamification ───────────────────────────────────────────────────
export const XP_REWARDS = {
  TASK_COMPLETED: 100,
  ON_TIME_BONUS: 50,
  FIVE_STAR_BONUS: 75,
  UNDER_ESTIMATED_BONUS: 25,
  REVIEW_COMPLETED: 10,
}

export const INITIAL_BADGES = [
  { name: 'First Catch', description: 'Complete your first task', criteria_type: 'tasks_completed', criteria_value: 1, icon: 'award' },
  { name: 'On the Clock', description: '100% on-time delivery, 5 consecutive tasks', criteria_type: 'on_time_streak', criteria_value: 5, icon: 'clock' },
  { name: 'Five Star', description: 'Receive a 5-star quality rating', criteria_type: 'quality_rating', criteria_value: 5, icon: 'star' },
  { name: 'Speed Demon', description: 'Complete 3 tasks under estimated time', criteria_type: 'under_estimated', criteria_value: 3, icon: 'zap' },
  { name: 'Streak Master', description: 'Complete 10 tasks with no revisions', criteria_type: 'no_revision_streak', criteria_value: 10, icon: 'trending-up' },
  { name: 'Heavy Lifter', description: 'Log 100+ hours of work', criteria_type: 'hours_logged', criteria_value: 6000, icon: 'shield' },
  { name: 'Feedback Champ', description: 'Complete 10 consecutive post-task reviews', criteria_type: 'review_streak', criteria_value: 10, icon: 'message-circle' },
]

// ── Validation Rules ───────────────────────────────────────────────
export const VALIDATION = {
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  TASK_TITLE_MIN: 3,
  TASK_TITLE_MAX: 255,
  TASK_DESCRIPTION_MIN: 10,
  COMMENT_MIN: 1,
  COMMENT_MAX: 5000,
  TIME_DESCRIPTION_MIN: 5,
  TIME_DESCRIPTION_MAX: 500,
  TIME_DURATION_MIN: 15,
  TIME_DURATION_MAX: 480,
}

// ── API ────────────────────────────────────────────────────────────
export const API_TIMEOUT_MS = 30000
export const FILE_UPLOAD_TIMEOUT_MS = 120000
export const SEARCH_DEBOUNCE_MS = 300
export const RATE_LIMIT_PER_MINUTE = 100
