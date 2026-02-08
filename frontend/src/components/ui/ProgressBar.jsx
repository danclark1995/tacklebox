import React from 'react'
import PropTypes from 'prop-types'
import { colours, radii, typography, transitions } from '@/config/tokens'

const ProgressBar = ({
  value = 0,
  size = 'md',
  colour = colours.primary[500],
  showLabel = false,
  className = '',
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100)

  const sizeStyles = {
    sm: { height: '4px' },
    md: { height: '8px' },
    lg: { height: '12px' },
  }

  const containerStyles = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  const barBackgroundStyles = {
    width: '100%',
    backgroundColor: colours.neutral[200],
    borderRadius: radii.full,
    overflow: 'hidden',
    ...sizeStyles[size],
  }

  const barFillStyles = {
    height: '100%',
    backgroundColor: colour,
    borderRadius: radii.full,
    width: `${clampedValue}%`,
    transition: `width ${transitions.normal}`,
  }

  const labelStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[700],
    textAlign: 'right',
  }

  return (
    <div style={containerStyles} className={className}>
      <div style={barBackgroundStyles}>
        <div style={barFillStyles} />
      </div>
      {showLabel && <div style={labelStyles}>{clampedValue}%</div>}
    </div>
  )
}

ProgressBar.propTypes = {
  value: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  colour: PropTypes.string,
  showLabel: PropTypes.bool,
  className: PropTypes.string,
}

export default ProgressBar
