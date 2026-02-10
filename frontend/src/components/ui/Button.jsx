import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography, transitions } from '@/config/tokens'
import EmberLoader from './EmberLoader'

const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon = null,
  children,
  onClick,
  type = 'button',
  fullWidth = false,
  className = '',
}) => {
  const baseStyles = {
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.medium,
    borderRadius: radii.md,
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: `all ${transitions.normal}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    outline: 'none',
  }

  const sizeStyles = {
    sm: {
      fontSize: typography.fontSize.sm,
      padding: `${spacing[2]} ${spacing[3]}`,
      height: '32px',
    },
    md: {
      fontSize: typography.fontSize.base,
      padding: `${spacing[2]} ${spacing[4]}`,
      height: '40px',
    },
    lg: {
      fontSize: typography.fontSize.lg,
      padding: `${spacing[3]} ${spacing[6]}`,
      height: '48px',
    },
  }

  const variantStyles = {
    primary: {
      backgroundColor: colours.neutral[900],
      color: colours.neutral[50],
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colours.neutral[900],
      border: `1px solid ${colours.neutral[900]}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colours.neutral[900],
      border: `1px solid ${colours.neutral[300]}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colours.neutral[700],
    },
    danger: {
      backgroundColor: colours.neutral[700],
      color: colours.neutral[50],
    },
  }

  const hoverStyles = {
    primary: { backgroundColor: colours.neutral[700] },
    secondary: { backgroundColor: colours.neutral[200] },
    outline: { backgroundColor: colours.neutral[200] },
    ghost: { backgroundColor: colours.neutral[200] },
    danger: { backgroundColor: colours.neutral[600] },
  }

  const [isHovered, setIsHovered] = React.useState(false)

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(isHovered && !disabled && !loading ? hoverStyles[variant] : {}),
  }

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault()
      return
    }
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <button
      type={type}
      style={combinedStyles}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <EmberLoader size="sm" />
      ) : (
        icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
      {children}
    </button>
  )
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
}

export default Button
