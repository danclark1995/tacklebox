import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { glow } from '@/config/tokens'

const GLOW_MAP = {
  none: glow.none,
  soft: glow.soft,
  medium: glow.medium,
  bright: glow.bright,
  intense: glow.intense,
}

const GlowCard = ({
  glow: glowLevel = 'none',
  glowOnHover = true,
  padding = '20px',
  className = '',
  onClick,
  style: styleProp,
  children,
  ...rest
}) => {
  const [hovered, setHovered] = useState(false)

  const baseGlow = GLOW_MAP[glowLevel] || glow.none
  const hoverGlow = glowOnHover && hovered ? glow.medium : glow.none

  const resolvedShadow = baseGlow !== 'none'
    ? baseGlow
    : hoverGlow !== 'none'
      ? hoverGlow
      : 'none'

  const cardStyle = {
    background: '#111111',
    border: `1px solid ${hovered && glowOnHover ? '#2a2a2a' : '#1a1a1a'}`,
    borderRadius: '8px',
    padding,
    transition: 'all 150ms ease',
    boxShadow: resolvedShadow,
    cursor: onClick ? 'pointer' : 'default',
    ...styleProp,
  }

  return (
    <div
      style={cardStyle}
      className={className}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...rest}
    >
      {children}
    </div>
  )
}

GlowCard.propTypes = {
  glow: PropTypes.oneOf(['none', 'soft', 'medium', 'bright', 'intense']),
  glowOnHover: PropTypes.bool,
  padding: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
  children: PropTypes.node,
}

export default GlowCard
