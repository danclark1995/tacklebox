import React from 'react'
import PropTypes from 'prop-types'
import GlowCard from '@/components/ui/GlowCard'
import { colours, spacing, typography, radii } from '@/config/tokens'

const StatCard = ({ label, value, sublabel, colour, icon }) => {
  const containerStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[4],
    borderLeft: colour ? `4px solid ${colour}` : 'none',
    borderRadius: colour ? radii.xl : undefined,
  }

  const contentStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
    flex: 1,
    minWidth: 0,
  }

  const valueStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colour || colours.neutral[900],
    lineHeight: typography.lineHeight.tight,
    margin: 0,
  }

  const labelStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[600],
    margin: 0,
  }

  const sublabelStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    color: colours.neutral[400],
    margin: 0,
  }

  const iconContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: radii.lg,
    backgroundColor: colour ? `${colour}15` : colours.neutral[100],
    color: colour || colours.neutral[500],
    flexShrink: 0,
  }

  return (
    <GlowCard>
      <div style={containerStyles}>
        {icon && (
          <div style={iconContainerStyles}>
            {icon}
          </div>
        )}
        <div style={contentStyles}>
          <p style={valueStyles}>{value}</p>
          <p style={labelStyles}>{label}</p>
          {sublabel && <p style={sublabelStyles}>{sublabel}</p>}
        </div>
      </div>
    </GlowCard>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sublabel: PropTypes.string,
  colour: PropTypes.string,
  icon: PropTypes.node,
}

export default StatCard
