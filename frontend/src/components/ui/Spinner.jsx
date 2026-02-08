import React from 'react'
import PropTypes from 'prop-types'
import { colours } from '@/config/tokens'

const Spinner = ({ size = 'md', colour = colours.primary[500], className = '' }) => {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 40,
  }

  const spinnerStyles = {
    width: `${sizes[size]}px`,
    height: `${sizes[size]}px`,
    border: `${sizes[size] / 8}px solid ${colours.neutral[200]}`,
    borderTop: `${sizes[size] / 8}px solid ${colour}`,
    borderRadius: '50%',
    animation: 'spin 800ms linear infinite',
    display: 'inline-block',
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinnerStyles} className={className} />
    </>
  )
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  colour: PropTypes.string,
  className: PropTypes.string,
}

export default Spinner
