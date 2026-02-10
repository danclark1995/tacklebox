import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { colours, transitions } from '@/config/tokens'

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
}

const Star = ({ filled, hovered, size, onClick, onMouseEnter, onMouseLeave, readOnly }) => {
  const px = sizeMap[size] || sizeMap.md

  const fillColor = hovered
    ? colours.neutral[500]
    : filled
      ? colours.neutral[600]
      : 'none'

  const strokeColor = hovered
    ? colours.neutral[500]
    : filled
      ? colours.neutral[600]
      : colours.neutral[300]

  const starStyle = {
    cursor: readOnly ? 'default' : 'pointer',
    transition: `color ${transitions.fast}, fill ${transitions.fast}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    background: 'none',
    border: 'none',
    outline: 'none',
    lineHeight: 0,
  }

  return (
    <button
      type="button"
      style={starStyle}
      onClick={readOnly ? undefined : onClick}
      onMouseEnter={readOnly ? undefined : onMouseEnter}
      onMouseLeave={readOnly ? undefined : onMouseLeave}
      tabIndex={readOnly ? -1 : 0}
      aria-label={readOnly ? undefined : 'Rate'}
    >
      <svg
        viewBox="0 0 24 24"
        width={px}
        height={px}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
        style={{ transition: `fill ${transitions.fast}, stroke ${transitions.fast}` }}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  )
}

Star.propTypes = {
  filled: PropTypes.bool.isRequired,
  hovered: PropTypes.bool.isRequired,
  size: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  readOnly: PropTypes.bool.isRequired,
}

const StarRating = ({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  readOnly = false,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  }

  const handleClick = (starNumber) => {
    if (!readOnly && onChange) {
      onChange(starNumber)
    }
  }

  const handleMouseEnter = (starIndex) => {
    if (!readOnly) {
      setHoveredIndex(starIndex)
    }
  }

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoveredIndex(null)
    }
  }

  return (
    <div style={containerStyle} className={className} role="group" aria-label="Star rating">
      {Array.from({ length: max }, (_, i) => {
        const starNumber = i + 1
        const filled = starNumber <= value
        const hovered = hoveredIndex !== null && starNumber <= hoveredIndex + 1

        return (
          <Star
            key={i}
            filled={filled}
            hovered={hovered}
            size={size}
            readOnly={readOnly}
            onClick={() => handleClick(starNumber)}
            onMouseEnter={() => handleMouseEnter(i)}
            onMouseLeave={handleMouseLeave}
          />
        )
      })}
    </div>
  )
}

StarRating.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  max: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  readOnly: PropTypes.bool,
  className: PropTypes.string,
}

export default StarRating
