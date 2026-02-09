import React from 'react'
import PropTypes from 'prop-types'
import ProgressBar from '@/components/ui/ProgressBar'
import { colours, spacing, typography, radii, shadows } from '@/config/tokens'

/**
 * XP progress bar widget showing current level and progress to the next level.
 *
 * Props:
 *   xpData   — { total_xp, current_level, level_name, level_icon, next_level_threshold, next_level_name }
 *   compact  — if true, renders a smaller version suitable for dashboard widgets
 *   levels   — optional array of { level, xp_threshold } for calculating current-level threshold
 */
const XPBar = ({ xpData, compact = false, levels = [] }) => {
  if (!xpData) return null

  const {
    total_xp = 0,
    current_level = 1,
    level_name = '',
    level_icon = '',
    next_level_threshold = 0,
    next_level_name = '',
  } = xpData

  // Determine the XP threshold for the current level.
  // If a levels list is provided, look up the threshold for the current level.
  // Otherwise, estimate it based on a simple heuristic (prev threshold = 0 for level 1).
  let currentLevelThreshold = 0
  if (levels && levels.length > 0) {
    const sorted = [...levels].sort((a, b) => a.level - b.level)
    const match = sorted.find(l => l.level === current_level)
    if (match) currentLevelThreshold = match.xp_threshold
  }

  const xpIntoLevel = total_xp - currentLevelThreshold
  const xpNeeded = next_level_threshold - currentLevelThreshold
  const progressPercent = xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100
  const xpRemaining = Math.max(next_level_threshold - total_xp, 0)

  const formattedXP = total_xp.toLocaleString()
  const formattedRemaining = xpRemaining.toLocaleString()

  // --- Icon map ----------------------------------------------------------
  const iconMap = {
    seedling: '\uD83C\uDF31',
    sprout: '\uD83C\uDF3F',
    herb: '\uD83C\uDF3F',
    tools: '\uD83D\uDEE0\uFE0F',
    hammer: '\uD83D\uDD28',
    wrench: '\uD83D\uDD27',
    star: '\u2B50',
    fire: '\uD83D\uDD25',
    trophy: '\uD83C\uDFC6',
    crown: '\uD83D\uDC51',
    gem: '\uD83D\uDC8E',
    rocket: '\uD83D\uDE80',
    lightning: '\u26A1',
    medal: '\uD83C\uDFC5',
    shield: '\uD83D\uDEE1\uFE0F',
    award: '\uD83C\uDFC6',
  }

  const resolveIcon = (name) => {
    if (!name) return '\uD83C\uDFC6'
    return iconMap[name.toLowerCase()] || name
  }

  // --- Compact layout ----------------------------------------------------
  if (compact) {
    return (
      <div style={compactContainerStyle}>
        <div style={compactHeaderStyle}>
          <span style={compactLevelStyle}>
            {resolveIcon(level_icon)} {level_name || `Level ${current_level}`}
          </span>
          <span style={compactXPStyle}>{formattedXP} XP</span>
        </div>
        <ProgressBar
          value={progressPercent}
          size="sm"
          colour={colours.primary[500]}
        />
      </div>
    )
  }

  // --- Full layout -------------------------------------------------------
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={levelInfoStyle}>
          <span style={levelIconStyle}>{resolveIcon(level_icon)}</span>
          <span style={levelNameStyle}>
            Level {current_level} &mdash; {level_name || 'Unknown'}
          </span>
        </div>
        <span style={xpNumberStyle}>{formattedXP} XP</span>
      </div>

      <ProgressBar
        value={progressPercent}
        size="md"
        colour={colours.primary[500]}
      />

      {next_level_name && (
        <div style={footerStyle}>
          {formattedRemaining} XP to next level ({next_level_name})
        </div>
      )}
    </div>
  )
}

// =========================================================================
// Styles
// =========================================================================

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const levelInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
}

const levelIconStyle = {
  fontSize: typography.fontSize['2xl'],
}

const levelNameStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.bold,
  color: colours.primary[600],
}

const xpNumberStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[600],
}

const footerStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  color: colours.neutral[500],
}

// Compact styles
const compactContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
}

const compactHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const compactLevelStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.bold,
  color: colours.primary[600],
}

const compactXPStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colours.neutral[500],
}

// =========================================================================
// PropTypes
// =========================================================================

XPBar.propTypes = {
  xpData: PropTypes.shape({
    total_xp: PropTypes.number,
    current_level: PropTypes.number,
    level_name: PropTypes.string,
    level_icon: PropTypes.string,
    next_level_threshold: PropTypes.number,
    next_level_name: PropTypes.string,
  }),
  compact: PropTypes.bool,
  levels: PropTypes.arrayOf(
    PropTypes.shape({
      level: PropTypes.number,
      xp_threshold: PropTypes.number,
    })
  ),
}

export default XPBar
