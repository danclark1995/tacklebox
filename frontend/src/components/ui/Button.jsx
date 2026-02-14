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
  style: externalStyle,
}) => {
  const baseStyles = {
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.medium,
    borderRadius: radii.md,
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
      backgroundColor: '#ffffff',
      color: '#0a0a0a',
      border: '1px solid transparent',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#ffffff',
      border: '1px solid #333',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#ffffff',
      border: '1px solid #333',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#999',
      border: '1px solid transparent',
    },
    danger: {
      backgroundColor: 'transparent',
      color: '#ff4444',
      border: '1px solid rgba(255, 68, 68, 0.3)',
    },
  }

  const hoverStyles = {
    primary: { boxShadow: '0 0 12px rgba(255, 255, 255, 0.15)', filter: 'brightness(0.95)' },
    secondary: { border: '1px solid #555', boxShadow: '0 0 8px rgba(255, 255, 255, 0.06)' },
    outline: { border: '1px solid #555', boxShadow: '0 0 8px rgba(255, 255, 255, 0.06)' },
    ghost: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.05)' },
    danger: { backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.5)' },
  }

  const [isHovered, setIsHovered] = React.useState(false)

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(isHovered && !disabled && !loading ? hoverStyles[variant] : {}),
    ...externalStyle,
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
  style: PropTypes.object,
}

export default Button
