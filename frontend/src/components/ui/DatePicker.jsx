import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography, transitions } from '@/config/tokens'

const DatePicker = ({
  label,
  value,
  onChange,
  min = '',
  max = '',
  error = '',
  disabled = false,
  required = false,
  className = '',
}) => {
  const [isFocused, setIsFocused] = React.useState(false)

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

  const inputStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    width: '100%',
    padding: `${spacing[2]} ${spacing[4]}`,
    height: '40px',
    borderRadius: radii.md,
    border: `1px solid ${error ? colours.error[500] : isFocused ? colours.primary[500] : colours.neutral[300]}`,
    backgroundColor: disabled ? colours.neutral[50] : colours.white,
    color: colours.neutral[900],
    transition: `all ${transitions.normal}`,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }

  const errorStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    color: colours.error[500],
  }

  return (
    <div style={wrapperStyles} className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: colours.error[500], marginLeft: spacing[1] }}>*</span>}
        </label>
      )}
      <input
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={inputStyles}
      />
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  )
}

DatePicker.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  min: PropTypes.string,
  max: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
}

export default DatePicker
