import React from 'react'
import PropTypes from 'prop-types'
import { colours } from '@/config/tokens'

const SIZES = {
  sm: 4,
  md: 8,
  lg: 12,
}

const WaveProgressBar = ({
  progress = 0,
  label,
  sublabel,
  size = 'md',
  showPercentage = false,
  className = '',
}) => {
  const clamped = Math.min(Math.max(progress, 0), 100)
  const height = SIZES[size] || SIZES.md

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: colours.neutral[900],
  }

  const percentStyle = {
    fontSize: '12px',
    color: colours.neutral[600],
    fontWeight: 500,
  }

  const trackStyle = {
    width: '100%',
    height: `${height}px`,
    background: colours.surfaceRaised,
    borderRadius: '999px',
    overflow: 'hidden',
    position: 'relative',
  }

  const fillStyle = {
    height: '100%',
    width: `${clamped}%`,
    background: `linear-gradient(90deg, ${colours.neutral[300]}, ${colours.neutral[900]})`,
    borderRadius: '999px',
    transition: 'width 500ms ease',
    position: 'relative',
  }

  const edgeGlowStyle = {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: `${height + 4}px`,
    height: `${height + 4}px`,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.4)',
    boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
    animation: clamped > 0 && clamped < 100 ? 'waveShift 2s ease-in-out infinite' : 'none',
  }

  const sublabelStyle = {
    fontSize: '12px',
    color: colours.neutral[500],
  }

  return (
    <div style={containerStyle} className={className}>
      {(label || showPercentage) && (
        <div style={headerStyle}>
          {label && <span style={labelStyle}>{label}</span>}
          {showPercentage && <span style={percentStyle}>{Math.round(clamped)}%</span>}
        </div>
      )}
      <div style={trackStyle}>
        <div style={fillStyle}>
          {clamped > 0 && <div style={edgeGlowStyle} />}
        </div>
      </div>
      {sublabel && <span style={sublabelStyle}>{sublabel}</span>}
    </div>
  )
}

WaveProgressBar.propTypes = {
  progress: PropTypes.number,
  label: PropTypes.string,
  sublabel: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showPercentage: PropTypes.bool,
  className: PropTypes.string,
}

export default WaveProgressBar
