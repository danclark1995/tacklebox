import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography, transitions } from '@/config/tokens'

const Textarea = ({
  label,
  value,
  onChange,
  rows = 4,
  error = '',
  disabled = false,
  required = false,
  maxLength = null,
  className = '',
  placeholder = '',
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

  const textareaStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    width: '100%',
    padding: spacing[3],
    borderRadius: radii.md,
    border: `1px solid ${error ? colours.neutral[700] : isFocused ? colours.neutral[900] : colours.neutral[300]}`,
    backgroundColor: disabled ? colours.neutral[50] : colours.white,
    color: colours.neutral[900],
    transition: `all ${transitions.normal}`,
    outline: 'none',
    resize: 'vertical',
    lineHeight: typography.lineHeight.normal,
  }

  const errorStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    color: colours.neutral[700],
  }

  const charCountStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    color: colours.neutral[500],
    textAlign: 'right',
  }

  const footerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  return (
    <div style={wrapperStyles} className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: colours.neutral[700], marginLeft: spacing[1] }}>*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
        required={required}
        maxLength={maxLength || undefined}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={textareaStyles}
      />
      <div style={footerStyles}>
        <div>{error && <span style={errorStyles}>{error}</span>}</div>
        <div>
          {maxLength && (
            <span style={charCountStyles}>
              {value?.length || 0} / {maxLength}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

Textarea.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  rows: PropTypes.number,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  maxLength: PropTypes.number,
  className: PropTypes.string,
  placeholder: PropTypes.string,
}

export default Textarea
