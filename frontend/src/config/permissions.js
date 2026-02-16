/**
 * Permissions Configuration
 *
 * Maps platform capabilities to the minimum camper level required.
 * Client role has its own separate permission set.
 *
 * Philosophy:
 * - Core tools (calendar, scheduling, analytics, brands) available from L1
 * - AI tools unlock progressively (L2-3) as tasks at that level need them
 * - Peer review at L6 (earned trust)
 * - Full admin/management at L7+ (everything, no further gating)
 */

// Minimum camper level required for each capability
export const LEVEL_REQUIREMENTS = {
  // === Core (Level 1 — everyone) ===
  VIEW_OWN_TASKS: 1,
  CLAIM_TASKS: 1,           // can claim campfire tasks at or below their level
  VIEW_CALENDAR: 1,
  SMART_SCHEDULE: 1,
  VIEW_BRANDS: 1,
  VIEW_OWN_ANALYTICS: 1,
  VIEW_EARNINGS: 1,
  VIEW_JOURNEY: 1,
  VIEW_PROJECTS: 1,         // projects they're assigned to
  LOG_TIME: 1,

  // === AI Tools (progressive unlock) ===
  AI_SOCIAL_IMAGES: 2,      // social media content tools
  AI_DOCUMENTS: 3,          // document generation
  AI_PRESENTATIONS: 3,      // presentation generation
  AI_AD_CREATIVES: 3,       // ad creative tools

  // === Peer Review (Level 6) ===
  REVIEW_OTHERS: 6,         // can review other campers' submitted work

  // === Admin / Management (Level 7+) ===
  MANAGE_ALL_TASKS: 7,      // view, edit, assign any task
  ASSIGN_CAMPERS: 7,        // assign campers to tasks
  SET_COMPLEXITY: 7,        // set task complexity level
  MANAGE_BRANDS: 7,         // create/edit brand profiles
  ONBOARD_BRANDS: 7,        // brand onboarding flow
  MANAGE_PROJECTS: 7,       // create/edit any project
  VIEW_ALL_ANALYTICS: 7,    // platform-wide analytics
  VIEW_ALL_CAMPERS: 7,      // camper roster
  MANAGE_CAMPERS: 7,        // edit camper profiles, activate/deactivate
  APPROVE_CASHOUTS: 7,      // process cashout requests
  CREATE_TASKS_FOR_CLIENTS: 7, // create tasks on behalf of clients
  VIEW_CREDITS: 7,          // view credit system
  MANAGE_CATEGORIES: 7,     // task categories
  MANAGE_TEMPLATES: 7,      // task templates
  PLATFORM_SETTINGS: 7,     // platform-wide settings
  MANAGE_JOURNEY: 7,        // configure XP levels, badges
}

// Navigation items by capability — used by Sidebar
// Each item maps to a level requirement, not a role
export const NAV_ITEMS = {
  camper: [
    // Core — everyone
    { path: '/camper', label: 'Home', icon: 'Flame', minLevel: 1 },
    { path: '/camper/tasks', label: 'Tasks', icon: 'CheckSquare', minLevel: 1 },
    { path: '/camper/projects', label: 'Projects', icon: 'FolderOpen', minLevel: 1 },
    { path: '/camper/calendar', label: 'Calendar', icon: 'Calendar', minLevel: 1 },
    { path: '/camper/brands', label: 'Brands', icon: 'Palette', minLevel: 1 },
    { path: '/camper/journey', label: 'Journey', icon: 'Compass', minLevel: 1 },

    // AI Tools — progressive
    { path: '/camper/tools', label: 'Tools', icon: 'Wrench', minLevel: 2 },

    // Management — Level 7+
    { path: '/camper/manage/tasks', label: 'Manage Tasks', icon: 'ClipboardList', minLevel: 7 },
    { path: '/camper/manage/campers', label: 'Campers', icon: 'Users', minLevel: 7 },
    { path: '/camper/manage/brands', label: 'Manage Brands', icon: 'BookOpen', minLevel: 7 },
    { path: '/camper/manage/settings', label: 'Settings', icon: 'Settings', minLevel: 7 },

    // Profile — always last
    { path: '/camper/profile', label: 'Profile', icon: 'User', minLevel: 1 },
  ],

  client: [
    { path: '/client', label: 'Home', icon: 'Home' },
    { path: '/client/tasks', label: 'Tasks', icon: 'CheckSquare' },
    { path: '/client/projects', label: 'Projects', icon: 'FolderOpen' },
    { path: '/client/credits', label: 'Credits', icon: 'CreditCard' },
    { path: '/client/brand-hub', label: 'Brand Hub', icon: 'BookOpen' },
    { path: '/client/profile', label: 'Profile', icon: 'User' },
  ],
}

// AI Tools — what's available at each level
export const AI_TOOLS = [
  { id: 'social', label: 'Social Content', path: 'social', minLevel: 2, icon: 'Image' },
  { id: 'document', label: 'Documents', path: 'document', minLevel: 3, icon: 'FileText' },
  { id: 'presentation', label: 'Presentations', path: 'presentation', minLevel: 3, icon: 'Presentation' },
  { id: 'ad', label: 'Ad Creatives', path: 'ad', minLevel: 3, icon: 'Megaphone' },
]

/**
 * Check if a user has a specific capability
 */
export function hasCapability(userLevel, capability) {
  const required = LEVEL_REQUIREMENTS[capability]
  if (required === undefined) return false
  return userLevel >= required
}

/**
 * Get effective level for a user
 * - admin role: minimum level 7 (backward compat during Phase 1)
 * - contractor role: actual level from XP
 * - client role: not applicable (returns 0)
 */
export function getEffectiveLevel(user) {
  if (!user) return 0
  if (user.role === 'client') return 0
  const actualLevel = user.level || 1
  // Admin backward compat: treat as at least Level 7
  if (user.role === 'admin') return Math.max(actualLevel, 7)
  return actualLevel
}

/**
 * Check if user is in admin tier (Level 7+)
 */
export function isAdminTier(user) {
  return getEffectiveLevel(user) >= 7
}
