import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography, shadows } from '@/config/tokens'

const ColourSwatch = ({
  colour,
  name,
  size = 'md',
  showHex = false,
  className = '',
}) => {
  const sizes = {
    sm: 24,
    md: 36,
    lg: 48,
  }

  const containerStyles = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[2],
  }

  const swatchStyles = {
    width: `${sizes[size]}px`,
    height: `${sizes[size]}px`,
    backgroundColor: colour,
    borderRadius: radii.md,
    boxShadow: shadows.sm,
    border: `1px solid ${colours.neutral[200]}`,
    flexShrink: 0,
  }

  const nameStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[900],
    textAlign: 'center',
  }

  const hexStyles = {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xs,
    color: colours.neutral[600],
    textAlign: 'center',
  }

  return (
    <div style={containerStyles} className={className}>
      <div style={swatchStyles} />
      {name && <div style={nameStyles}>{name}</div>}
      {showHex && <div style={hexStyles}>{colour}</div>}
    </div>
  )
}

ColourSwatch.propTypes = {
  colour: PropTypes.string.isRequired,
  name: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showHex: PropTypes.bool,
  className: PropTypes.string,
}

export default ColourSwatch
