import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, transitions } from '@/config/tokens'

const Toggle = ({
  checked = false,
  onChange,
  label,
  helperText,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && onChange) onChange(!checked)
  }

  return (
    <div style={{ opacity: disabled ? 0.5 : 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={handleClick}
      >
        <div style={{
          position: 'relative',
          width: '40px',
          height: '22px',
          borderRadius: '11px',
          backgroundColor: checked ? colours.neutral[900] : colours.neutral[200],
          border: `1px solid ${checked ? colours.neutral[900] : colours.neutral[300]}`,
          boxShadow: checked ? '0 0 8px rgba(255,255,255,0.15)' : 'none',
          transition: 'all 150ms ease',
          flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '20px' : '2px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: checked ? colours.neutral[100] : colours.neutral[400],
            boxShadow: checked ? '0 0 4px rgba(255,255,255,0.2)' : 'none',
            transition: 'all 150ms ease',
          }} />
        </div>
        {label && (
          <span style={{
            fontSize: '14px',
            color: colours.neutral[900],
            userSelect: 'none',
          }}>
            {label}
          </span>
        )}
      </div>
      {helperText && (
        <div style={{
          fontSize: '12px',
          color: colours.neutral[400],
          marginTop: '6px',
          marginLeft: '52px',
        }}>
          {helperText}
        </div>
      )}
    </div>
  )
}

Toggle.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
}

export default Toggle
