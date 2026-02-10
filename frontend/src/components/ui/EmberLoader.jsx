import React from 'react'
import PropTypes from 'prop-types'

const DOT_SIZES = {
  sm: 4,
  md: 6,
  lg: 8,
}

const EmberLoader = ({
  size = 'md',
  text,
}) => {
  const dotSize = DOT_SIZES[size] || DOT_SIZES.md

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  }

  const dotsStyle = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  }

  const dotStyle = (delay) => ({
    width: `${dotSize}px`,
    height: `${dotSize}px`,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    animation: `emberPulse 1.2s ease-in-out ${delay}s infinite`,
  })

  const textStyle = {
    fontSize: '12px',
    color: '#737373',
  }

  return (
    <div style={containerStyle}>
      <div style={dotsStyle}>
        <div style={dotStyle(0)} />
        <div style={dotStyle(0.3)} />
        <div style={dotStyle(0.6)} />
      </div>
      {text && <span style={textStyle}>{text}</span>}
    </div>
  )
}

EmberLoader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  text: PropTypes.string,
}

export default EmberLoader
