import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography, transitions } from '@/config/tokens'

const Input = ({
  label,
  placeholder = '',
  value,
  onChange,
  type = 'text',
  error = '',
  disabled = false,
  required = false,
  size = 'md',
  icon = null,
  className = '',
  ...rest
}) => {
  const [isFocused, setIsFocused] = React.useState(false)

  const sizeStyles = {
    sm: {
      fontSize: typography.fontSize.sm,
      padding: icon ? `${spacing[2]} ${spacing[2]} ${spacing[2]} ${spacing[8]}` : `${spacing[2]} ${spacing[3]}`,
      height: '32px',
    },
    md: {
      fontSize: typography.fontSize.base,
      padding: icon ? `${spacing[2]} ${spacing[3]} ${spacing[2]} ${spacing[8]}` : `${spacing[2]} ${spacing[4]}`,
      height: '40px',
    },
    lg: {
      fontSize: typography.fontSize.lg,
      padding: icon ? `${spacing[3]} ${spacing[4]} ${spacing[3]} ${spacing[10]}` : `${spacing[3]} ${spacing[4]}`,
      height: '48px',
    },
  }

  const wrapperStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  }

  const labelStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[700],
  }

  const inputContainerStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  }

  const inputStyles = {
    fontFamily: typography.fontFamily.sans,
    width: '100%',
    borderRadius: radii.md,
    border: `1px solid ${error ? colours.neutral[700] : isFocused ? colours.neutral[900] : colours.neutral[300]}`,
    backgroundColor: disabled ? colours.neutral[50] : colours.white,
    color: colours.neutral[900],
    transition: `all ${transitions.normal}`,
    outline: 'none',
    ...sizeStyles[size],
  }

  const iconStyles = {
    position: 'absolute',
    left: spacing[3],
    display: 'flex',
    alignItems: 'center',
    color: colours.neutral[500],
    pointerEvents: 'none',
  }

  const errorStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    color: colours.neutral[700],
    marginTop: spacing[1],
  }

  return (
    <div style={wrapperStyles} className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: colours.neutral[700], marginLeft: spacing[1] }}>*</span>}
        </label>
      )}
      <div style={inputContainerStyles}>
        {icon && <span style={iconStyles}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={inputStyles}
          {...rest}
        />
      </div>
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  )
}

Input.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  type: PropTypes.oneOf(['text', 'email', 'password', 'number']),
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.node,
  className: PropTypes.string,
}

export default Input
