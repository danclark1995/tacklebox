import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, typography } from '@/config/tokens'

const PageHeader = ({
  title,
  subtitle,
  actions,
  backLink,
  className = '',
}) => {
  const containerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[6],
    gap: spacing[4],
    flexWrap: 'wrap',
  }

  const leftSideStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  }

  const backLinkStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colours.neutral[900],
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[1],
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: 0,
  }

  const titleStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
    margin: 0,
  }

  const subtitleStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    color: colours.neutral[600],
    margin: 0,
  }

  const actionsStyles = {
    display: 'flex',
    gap: spacing[3],
    alignItems: 'center',
  }

  return (
    <div style={containerStyles} className={className}>
      <div style={leftSideStyles}>
        {backLink && (
          <button style={backLinkStyles} onClick={backLink.onClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {backLink.label}
          </button>
        )}
        <h1 style={titleStyles}>{title}</h1>
        {subtitle && <p style={subtitleStyles}>{subtitle}</p>}
      </div>
      {actions && <div style={actionsStyles}>{actions}</div>}
    </div>
  )
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  backLink: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  className: PropTypes.string,
}

export default PageHeader
