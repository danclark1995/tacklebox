import React from 'react'
import PropTypes from 'prop-types'
import { Flame } from 'lucide-react'
import { glow } from '@/config/tokens'

const SIZES = {
  sm: 16,
  md: 24,
  lg: 36,
}

const getAnimationDuration = (level) => {
  if (level >= 10) return '1s'
  if (level >= 7) return '1.5s'
  if (level >= 4) return '2s'
  return '3s'
}

const getGlow = (level) => {
  if (level >= 10) return glow.intense
  if (level >= 7) return glow.bright
  if (level >= 4) return glow.medium
  return glow.soft
}

const FlameIcon = ({
  level = 1,
  size = 'md',
  animated = true,
}) => {
  const px = SIZES[size] || SIZES.md
  const glowShadow = getGlow(level)
  const duration = getAnimationDuration(level)

  const wrapperStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: `${px + 8}px`,
    height: `${px + 8}px`,
    borderRadius: '50%',
    boxShadow: glowShadow,
    animation: animated ? 'flameGlow 3s ease-in-out infinite' : 'none',
  }

  const iconStyle = {
    animation: animated ? `flameShimmer ${duration} ease-in-out infinite` : 'none',
    display: 'flex',
  }

  return (
    <span style={wrapperStyle}>
      <span style={iconStyle}>
        <Flame size={px} color="#ffffff" />
      </span>
    </span>
  )
}

FlameIcon.propTypes = {
  level: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  animated: PropTypes.bool,
}

export default FlameIcon
