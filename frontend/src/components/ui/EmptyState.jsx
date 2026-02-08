import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, typography } from '@/config/tokens'
import Button from './Button'

const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[12],
    textAlign: 'center',
  }

  const iconContainerStyles = {
    fontSize: typography.fontSize['4xl'],
    color: colours.neutral[300],
    marginBottom: spacing[4],
  }

  const defaultIcon = (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )

  const titleStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    marginBottom: spacing[2],
  }

  const descriptionStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    color: colours.neutral[600],
    marginBottom: spacing[6],
    maxWidth: '400px',
  }

  return (
    <div style={containerStyles} className={className}>
      <div style={iconContainerStyles}>
        {typeof icon === 'string' ? icon : icon || defaultIcon}
      </div>
      {title && <h3 style={titleStyles}>{title}</h3>}
      {description && <p style={descriptionStyles}>{description}</p>}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  className: PropTypes.string,
}

export default EmptyState
