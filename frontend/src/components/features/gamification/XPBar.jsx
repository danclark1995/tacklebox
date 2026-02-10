import React from 'react'
import PropTypes from 'prop-types'
import FlameIcon from '@/components/ui/FlameIcon'
import WaveProgressBar from '@/components/ui/WaveProgressBar'
import { colours, spacing, typography } from '@/config/tokens'

const XPBar = ({ xpData, compact = false }) => {
  if (!xpData) return null

  const {
    total_xp = 0,
    current_level = 1,
    current_level_details,
    next_level,
    xp_to_next_level,
  } = xpData

  const levelName = current_level_details?.name || `Level ${current_level}`
  const fireStage = current_level_details?.fire_stage || ''
  const rateMin = current_level_details?.rate_min || 0
  const rateMax = current_level_details?.rate_max || 0
  const currentXpRequired = current_level_details?.xp_required || 0

  const nextXpRequired = next_level?.xp_required || 0
  const nextLevelName = next_level?.name || ''

  const xpIntoLevel = total_xp - currentXpRequired
  const xpNeeded = nextXpRequired - currentXpRequired
  const progressPercent = xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100
  const xpRemaining = xp_to_next_level != null ? Math.max(xp_to_next_level, 0) : 0

  const formattedXP = total_xp.toLocaleString()
  const formattedRemaining = xpRemaining.toLocaleString()

  const rateLabel = rateMax > 0
    ? `$${rateMin}-$${rateMax}/hr`
    : rateMin > 0
      ? `$${rateMin}+/hr`
      : '$0/hr'

  if (compact) {
    return (
      <div style={compactContainerStyle}>
        <div style={compactHeaderStyle}>
          <span style={compactLevelStyle}>
            <FlameIcon level={current_level} size="sm" />
            <span style={{ marginLeft: '4px' }}>{levelName}</span>
          </span>
          <span style={compactXPStyle}>{formattedXP} XP</span>
        </div>
        <WaveProgressBar progress={progressPercent} size="sm" />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={levelInfoStyle}>
          <FlameIcon level={current_level} size="md" />
          <span style={levelNameStyle}>
            Level {current_level} &mdash; {levelName}
          </span>
        </div>
        <span style={xpNumberStyle}>{formattedXP} XP</span>
      </div>

      {fireStage && (
        <div style={fireStageStyle}>{fireStage}</div>
      )}

      <WaveProgressBar
        progress={progressPercent}
        size="md"
        sublabel={nextLevelName ? `${formattedRemaining} XP to ${nextLevelName}` : undefined}
      />

      <div style={footerStyle}>
        <span>{rateLabel}</span>
      </div>
    </div>
  )
}

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

const levelNameStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.bold,
  color: colours.neutral[900],
}

const xpNumberStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[600],
}

const fireStageStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  color: colours.neutral[500],
  fontStyle: 'italic',
}

const footerStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  color: colours.neutral[500],
}

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
  color: colours.neutral[900],
  display: 'inline-flex',
  alignItems: 'center',
}

const compactXPStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colours.neutral[500],
}

XPBar.propTypes = {
  xpData: PropTypes.shape({
    total_xp: PropTypes.number,
    current_level: PropTypes.number,
    current_level_details: PropTypes.object,
    next_level: PropTypes.object,
    xp_to_next_level: PropTypes.number,
  }),
  compact: PropTypes.bool,
}

export default XPBar
