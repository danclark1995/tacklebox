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

// 12-Tier Scaling System
export const SCALING_TIERS = [
  { level: 1,  name: 'Volunteer',    xpRequired: 0,      rateMin: 0,   rateMax: 12,  fireStage: 'Strike the Match',  description: 'Learning the basics, step-by-step guidance' },
  { level: 2,  name: 'Apprentice',   xpRequired: 500,    rateMin: 12,  rateMax: 24,  fireStage: 'Strike the Match',  description: 'Using tools, building foundations' },
  { level: 3,  name: 'Junior',       xpRequired: 1500,   rateMin: 24,  rateMax: 36,  fireStage: 'Find Kindling',     description: 'Minimal complexity, growing skills' },
  { level: 4,  name: 'Intermediate', xpRequired: 3500,   rateMin: 36,  rateMax: 60,  fireStage: 'Light First Flame', description: 'Average complexity, gaining confidence' },
  { level: 5,  name: 'Senior',       xpRequired: 7000,   rateMin: 60,  rateMax: 96,  fireStage: 'Feed the Fire',     description: 'High complexity work' },
  { level: 6,  name: 'Specialist',   xpRequired: 12000,  rateMin: 96,  rateMax: 120, fireStage: 'Choose Your Wood',  description: 'Custom work from brand guidelines' },
  { level: 7,  name: 'Camp Leader',  xpRequired: 20000,  rateMin: 120, rateMax: 120, fireStage: 'Build the Blaze',   description: 'The transition - leading own projects' },
  { level: 8,  name: 'Guide',        xpRequired: 30000,  rateMin: 120, rateMax: 240, fireStage: 'Build the Blaze',   description: 'Leading teams, creating blueprints' },
  { level: 9,  name: 'Trailblazer',  xpRequired: 45000,  rateMin: 240, rateMax: 360, fireStage: 'Share the Warmth',  description: 'Advanced leadership, mapping new paths' },
  { level: 10, name: 'Pioneer',      xpRequired: 65000,  rateMin: 360, rateMax: 600, fireStage: 'Share the Warmth',  description: 'Innovation and originality' },
  { level: 11, name: 'Legend',        xpRequired: 90000,  rateMin: 600, rateMax: 960, fireStage: 'Tend the Embers',   description: 'Industry-level impact' },
  { level: 12, name: 'Legacy',        xpRequired: 120000, rateMin: 960, rateMax: 0,   fireStage: 'Tend the Embers',   description: 'Building your own campsite' },
]

export const FIRE_STAGES = [
  'Strike the Match',
  'Find Kindling',
  'Light First Flame',
  'Feed the Fire',
  'Choose Your Wood',
  'Build the Blaze',
  'Share the Warmth',
  'Tend the Embers',
]

export const BADGES = [
  { id: 'first-spark',      name: 'First Spark',      description: 'Completed your first task',            icon: 'flame',              triggerType: 'tasks_completed',   triggerValue: 1 },
  { id: 'kindling',         name: 'Kindling',         description: 'Completed 5 tasks',                    icon: 'layers',             triggerType: 'tasks_completed',   triggerValue: 5 },
  { id: 'flame-keeper',     name: 'Flame Keeper',     description: 'Completed 25 tasks',                   icon: 'fire-extinguisher',  triggerType: 'tasks_completed',   triggerValue: 25 },
  { id: 'blaze-builder',    name: 'Blaze Builder',    description: 'Completed 50 tasks',                   icon: 'zap',                triggerType: 'tasks_completed',   triggerValue: 50 },
  { id: 'warmth-sharer',    name: 'Warmth Sharer',    description: 'Gave your first review',               icon: 'heart-handshake',    triggerType: 'reviews_given',     triggerValue: 1 },
  { id: 'ember-tender',     name: 'Ember Tender',     description: 'Completed 100 tasks',                  icon: 'sparkles',           triggerType: 'tasks_completed',   triggerValue: 100 },
  { id: 'keeper-fish',      name: 'Keeper Fish',      description: 'Reached Level 7 - Camp Leader',        icon: 'fish',               triggerType: 'level_reached',     triggerValue: 7 },
  { id: 'gold-standard',    name: 'Gold Standard',    description: 'Achieved 5-star average rating',       icon: 'star',               triggerType: 'avg_rating',        triggerValue: 5 },
  { id: 'trailblazer',      name: 'Trailblazer',      description: 'Worked across 5+ categories',          icon: 'compass',            triggerType: 'categories_worked', triggerValue: 5 },
  { id: 'community-pillar', name: 'Community Pillar', description: 'Helped 10+ clients',                   icon: 'tent',               triggerType: 'clients_helped',    triggerValue: 10 },
  { id: 'forest-builder',   name: 'Forest Builder',   description: 'Reached Level 10 - Pioneer',           icon: 'tree-pine',          triggerType: 'level_reached',     triggerValue: 10 },
  { id: 'legacy-maker',     name: 'Legacy Maker',     description: 'Reached Level 12 - Legacy',            icon: 'trees',              triggerType: 'level_reached',     triggerValue: 12 },
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
