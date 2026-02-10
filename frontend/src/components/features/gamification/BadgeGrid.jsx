import React from 'react'
import PropTypes from 'prop-types'
import {
  Flame, Layers, Zap, Star, Compass, Sparkles, Fish, Lock,
  HeartHandshake, TreePine, Trees, Award, FireExtinguisher, Tent,
} from 'lucide-react'
import GlowCard from '@/components/ui/GlowCard'
import Badge from '@/components/ui/Badge'
import { colours, spacing, typography, radii, shadows } from '@/config/tokens'

const ICON_MAP = {
  'flame': Flame,
  'layers': Layers,
  'fire-extinguisher': FireExtinguisher,
  'zap': Zap,
  'heart-handshake': HeartHandshake,
  'sparkles': Sparkles,
  'fish': Fish,
  'star': Star,
  'compass': Compass,
  'tent': Tent,
  'tree-pine': TreePine,
  'trees': Trees,
  'award': Award,
}

const resolveIcon = (name) => {
  return ICON_MAP[(name || '').toLowerCase()] || Award
}

const BadgeGrid = ({ badges = [], compact = false }) => {
  if (!badges || badges.length === 0) return null

  const displayBadges = compact ? badges.filter(b => b.earned) : badges

  if (displayBadges.length === 0) return null

  if (compact) {
    return (
      <div style={compactContainerStyle}>
        {displayBadges.map(badge => {
          const IconComponent = resolveIcon(badge.icon_name || badge.icon)
          return (
            <div key={badge.id} style={compactBadgeStyle}>
              <IconComponent size={18} color={colours.neutral[900]} />
              <span style={compactNameStyle}>{badge.name}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={gridStyle}>
      {badges.map(badge => {
        const IconComponent = resolveIcon(badge.icon_name || badge.icon)
        const earned = badge.earned

        return (
          <GlowCard key={badge.id}>
            <div style={cardInnerStyle}>
              {earned && <div style={accentBar} />}

              <div style={iconContainerStyle}>
                <IconComponent
                  size={32}
                  color={earned ? colours.neutral[900] : colours.neutral[400]}
                  style={{ opacity: earned ? 1 : 0.4 }}
                />
                {!earned && (
                  <span style={lockOverlayStyle}>
                    <Lock size={12} color={colours.neutral[400]} />
                  </span>
                )}
              </div>

              <div style={{
                ...nameStyle,
                color: earned ? colours.neutral[900] : colours.neutral[400],
              }}>
                {badge.name}
              </div>

              <div style={{
                ...descriptionStyle,
                color: earned ? colours.neutral[600] : colours.neutral[400],
              }}>
                {badge.description}
              </div>

              {earned ? (
                <Badge variant="neutral" size="sm">
                  Earned {badge.awarded_at
                    ? new Date(badge.awarded_at).toLocaleDateString()
                    : ''}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not yet earned</Badge>
              )}
            </div>
          </GlowCard>
        )
      })}
    </div>
  )
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: spacing[4],
}

const cardInnerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: spacing[3],
  position: 'relative',
  overflow: 'hidden',
}

const accentBar = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  background: `linear-gradient(90deg, ${colours.neutral[900]}, ${colours.neutral[500]}, ${colours.neutral[900]})`,
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

BadgeGrid.propTypes = {
  badges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.string,
      icon_name: PropTypes.string,
      earned: PropTypes.bool,
      awarded_at: PropTypes.string,
    })
  ),
  compact: PropTypes.bool,
}

export default BadgeGrid
