import React from 'react'
import PropTypes from 'prop-types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { colours, spacing, typography, radii, shadows, transitions } from '@/config/tokens'

/**
 * Badge icon name -> visual representation.
 * Each entry has an emoji, a fallback SVG-safe label, and an accent colour.
 */
const ICON_MAP = {
  award:           { emoji: '\uD83C\uDFC6', colour: colours.neutral[800] },
  clock:           { emoji: '\u23F0',       colour: colours.info[500] },
  star:            { emoji: '\u2B50',       colour: colours.neutral[700] },
  zap:             { emoji: '\u26A1',       colour: colours.warning[500] },
  'trending-up':   { emoji: '\uD83D\uDCC8', colour: colours.success[500] },
  shield:          { emoji: '\uD83D\uDEE1\uFE0F', colour: colours.neutral[600] },
  'message-circle':{ emoji: '\uD83D\uDCAC', colour: colours.primary[400] },
  trophy:          { emoji: '\uD83C\uDFC6', colour: colours.neutral[800] },
  fire:            { emoji: '\uD83D\uDD25', colour: colours.secondary[500] },
  target:          { emoji: '\uD83C\uDFAF', colour: colours.error[500] },
  check:           { emoji: '\u2705',       colour: colours.success[500] },
  rocket:          { emoji: '\uD83D\uDE80', colour: colours.info[500] },
}

const resolveIcon = (name) => {
  const entry = ICON_MAP[(name || '').toLowerCase()]
  return entry || { emoji: '\uD83C\uDFC5', colour: colours.neutral[400] }
}

/**
 * BadgeGrid — displays earned and available badges in a responsive grid or
 * a compact horizontal-scroll row (earned only).
 */
const BadgeGrid = ({ badges = [], compact = false }) => {
  if (!badges || badges.length === 0) return null

  const displayBadges = compact ? badges.filter(b => b.earned) : badges

  if (displayBadges.length === 0) return null

  // --- Compact: horizontal scroll row ------------------------------------
  if (compact) {
    return (
      <div style={compactContainerStyle}>
        {displayBadges.map(badge => {
          const icon = resolveIcon(badge.icon)
          return (
            <div key={badge.id} style={compactBadgeStyle}>
              <span style={{ fontSize: typography.fontSize['2xl'] }}>{icon.emoji}</span>
              <span style={compactNameStyle}>{badge.name}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // --- Full grid ---------------------------------------------------------
  return (
    <div style={gridStyle}>
      {badges.map(badge => {
        const icon = resolveIcon(badge.icon)
        const earned = badge.earned

        return (
          <Card key={badge.id} padding="md">
            <div style={earned ? earnedCardInner : unearnedCardInner}>
              {/* Border accent for earned badges */}
              {earned && <div style={goldAccent} />}

              {/* Icon */}
              <div style={iconContainerStyle}>
                <span
                  style={{
                    fontSize: typography.fontSize['4xl'],
                    filter: earned ? 'none' : 'grayscale(100%)',
                    opacity: earned ? 1 : 0.4,
                    position: 'relative',
                  }}
                >
                  {icon.emoji}
                </span>
                {!earned && <span style={lockOverlayStyle}>{'\uD83D\uDD12'}</span>}
              </div>

              {/* Name */}
              <div
                style={{
                  ...nameStyle,
                  color: earned ? colours.neutral[900] : colours.neutral[400],
                }}
              >
                {badge.name}
              </div>

              {/* Description */}
              <div
                style={{
                  ...descriptionStyle,
                  color: earned ? colours.neutral[600] : colours.neutral[400],
                }}
              >
                {badge.description}
              </div>

              {/* Status label */}
              {earned ? (
                <Badge variant="success" size="sm">
                  Earned {badge.awarded_at
                    ? new Date(badge.awarded_at).toLocaleDateString()
                    : ''}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not yet earned</Badge>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// =========================================================================
// Styles
// =========================================================================

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: spacing[4],
}

const earnedCardInner = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: spacing[3],
  position: 'relative',
  overflow: 'hidden',
}

const unearnedCardInner = {
  ...earnedCardInner,
}

const goldAccent = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  background: 'linear-gradient(90deg, #ffffff, #a3a3a3, #ffffff)',
  borderRadius: `${radii.sm} ${radii.sm} 0 0`,
}

const iconContainerStyle = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: spacing[2],
}

const lockOverlayStyle = {
  position: 'absolute',
  bottom: '-4px',
  right: '-8px',
  fontSize: typography.fontSize.base,
}

const nameStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.bold,
}

const descriptionStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  lineHeight: typography.lineHeight.normal,
}

// Compact styles
const compactContainerStyle = {
  display: 'flex',
  gap: spacing[3],
  overflowX: 'auto',
  paddingBottom: spacing[2],
}

const compactBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  padding: `${spacing[2]} ${spacing[3]}`,
  backgroundColor: colours.white,
  borderRadius: radii.lg,
  boxShadow: shadows.sm,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const compactNameStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colours.neutral[700],
}

// =========================================================================
// PropTypes
// =========================================================================

BadgeGrid.propTypes = {
  badges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.string,
      earned: PropTypes.bool,
      awarded_at: PropTypes.string,
    })
  ),
  compact: PropTypes.bool,
}

export default BadgeGrid
