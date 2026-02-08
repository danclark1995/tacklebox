import React from 'react'
import PropTypes from 'prop-types'
import { colours, radii, spacing } from '@/config/tokens'

const Skeleton = ({
  width = '100%',
  height = '20px',
  variant = 'rect',
  count = 1,
  className = '',
}) => {
  const baseStyles = {
    backgroundColor: colours.neutral[200],
    backgroundImage: `linear-gradient(90deg, ${colours.neutral[200]} 0%, ${colours.neutral[100]} 50%, ${colours.neutral[200]} 100%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    display: 'inline-block',
  }

  const variantStyles = {
    text: {
      width,
      height,
      borderRadius: radii.sm,
    },
    circle: {
      width: height,
      height: height,
      borderRadius: '50%',
    },
    rect: {
      width,
      height,
      borderRadius: radii.md,
    },
  }

  const skeletonStyles = {
    ...baseStyles,
    ...variantStyles[variant],
  }

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      {count > 1 ? (
        <div style={containerStyles} className={className}>
          {[...Array(count)].map((_, i) => (
            <div key={i} style={skeletonStyles} />
          ))}
        </div>
      ) : (
        <div style={skeletonStyles} className={className} />
      )}
    </>
  )
}

Skeleton.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  variant: PropTypes.oneOf(['text', 'circle', 'rect']),
  count: PropTypes.number,
  className: PropTypes.string,
}

export default Skeleton
