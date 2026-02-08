import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography } from '@/config/tokens'

const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const variantStyles = {
    primary: {
      backgroundColor: colours.primary[100],
      color: colours.primary[700],
    },
    secondary: {
      backgroundColor: colours.secondary[100],
      color: colours.secondary[700],
    },
    success: {
      backgroundColor: colours.success[100],
      color: colours.success[700],
    },
    warning: {
      backgroundColor: colours.warning[100],
      color: colours.warning[700],
    },
    error: {
      backgroundColor: colours.error[100],
      color: colours.error[700],
    },
    info: {
      backgroundColor: colours.info[100],
      color: colours.info[700],
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
