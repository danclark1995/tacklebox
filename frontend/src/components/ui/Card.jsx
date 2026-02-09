import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, shadows, transitions } from '@/config/tokens'

const Card = ({
  children,
  padding = 'md',
  hover = false,
  onClick,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const paddingStyles = {
    sm: spacing[4],
    md: spacing[6],
    lg: spacing[8],
  }

  const baseStyles = {
    backgroundColor: colours.white,
    borderRadius: radii.xl,
    border: `1px solid ${colours.neutral[200]}`,
    boxShadow: isHovered && hover ? shadows.md : shadows.none,
    padding: paddingStyles[padding],
    transition: `all ${transitions.normal}`,
    cursor: onClick ? 'pointer' : 'default',
    transform: isHovered && hover ? 'translateY(-2px)' : 'translateY(0)',
  }

  return (
    <div
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
    >
      {children}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  padding: PropTypes.oneOf(['sm', 'md', 'lg']),
  hover: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
}

export default Card
