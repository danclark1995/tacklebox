import React from 'react'
import PropTypes from 'prop-types'
import { colours, radii, typography } from '@/config/tokens'

const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  }

  const fontSizes = {
    sm: typography.fontSize.sm,
    md: typography.fontSize.base,
    lg: typography.fontSize.xl,
    xl: typography.fontSize['3xl'],
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getColourFromName = (name) => {
    if (!name) return colours.neutral[400]

    const colourPalette = [
      colours.neutral[400],
      colours.neutral[500],
      colours.neutral[600],
      colours.neutral[700],
      colours.neutral[800],
      colours.neutral[900],
    ]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colourPalette[Math.abs(hash) % colourPalette.length]
  }

  const avatarStyles = {
    width: `${sizes[size]}px`,
    height: `${sizes[size]}px`,
    borderRadius: radii.full,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  }

  const imageStyles = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }

  const initialsStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: fontSizes[size],
    fontWeight: typography.fontWeight.semibold,
    color: '#ffffff',
    backgroundColor: getColourFromName(name),
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div style={avatarStyles} className={className}>
      {src ? (
        <img src={src} alt={name || 'Avatar'} style={imageStyles} />
      ) : (
        <div style={initialsStyles}>{getInitials(name)}</div>
      )}
    </div>
  )
}

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
}

export default Avatar
