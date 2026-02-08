import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography, transitions } from '@/config/tokens'
import Spinner from './Spinner'

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  loading = false,
  className = '',
}) => {
  const containerStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  }

  const inputStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    width: '100%',
    padding: `${spacing[2]} ${spacing[4]} ${spacing[2]} ${spacing[10]}`,
    height: '40px',
    borderRadius: radii.md,
    border: `1px solid ${colours.neutral[300]}`,
    backgroundColor: colours.white,
    color: colours.neutral[900],
    transition: `all ${transitions.normal}`,
    outline: 'none',
  }

  const iconStyles = {
    position: 'absolute',
    left: spacing[3],
    display: 'flex',
    alignItems: 'center',
    color: colours.neutral[500],
    pointerEvents: 'none',
  }

  const spinnerContainerStyles = {
    position: 'absolute',
    right: spacing[3],
    display: 'flex',
    alignItems: 'center',
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit(value)
    }
  }

  return (
    <div style={containerStyles} className={className}>
      <div style={iconStyles}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        style={inputStyles}
        onFocus={(e) => {
          e.target.style.borderColor = colours.primary[500]
        }}
        onBlur={(e) => {
          e.target.style.borderColor = colours.neutral[300]
        }}
      />
      {loading && (
        <div style={spinnerContainerStyles}>
          <Spinner size="sm" colour={colours.primary[500]} />
        </div>
      )}
    </div>
  )
}

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  placeholder: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string,
}

export default SearchBar
