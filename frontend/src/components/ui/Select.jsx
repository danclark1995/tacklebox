import React from 'react'
import PropTypes from 'prop-types'
import Dropdown from './Dropdown'
import { colours, spacing, typography } from '@/config/tokens'

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = '',
  disabled = false,
  required = false,
  className = '',
}) => {
  const handleChange = (val) => {
    // Synthesize event for backward compatibility with existing callers
    onChange && onChange({ target: { value: val } })
  }

  return (
    <div style={wrapperStyles} className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: colours.neutral[500], marginLeft: spacing[1] }}>*</span>}
        </label>
      )}
      <Dropdown
        options={options}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  )
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
  color: colours.neutral[500],
}

const errorStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.xs,
  color: colours.neutral[500],
}

Select.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  placeholder: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
}

export default Select
