import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography } from '@/config/tokens'

const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const variantStyles = {
    primary: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[900],
    },
    secondary: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[800],
    },
    success: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[700],
    },
    warning: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[700],
    },
    error: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[500],
    },
    info: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[700],
    },
    neutral: {
      backgroundColor: colours.neutral[100],
      color: colours.neutral[700],
    },
  }

  const sizeStyles = {
    sm: {
      fontSize: typography.fontSize.xs,
      padding: `${spacing[1]} ${spacing[2]}`,
    },
    md: {
      fontSize: typography.fontSize.sm,
      padding: `${spacing[1]} ${spacing[3]}`,
    },
  }

  const badgeStyles = {
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.medium,
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: radii.full,
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
    ...sizeStyles[size],
  }

  return (
    <span style={badgeStyles} className={className}>
      {children}
    </span>
  )
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral']),
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
}

export default Badge
