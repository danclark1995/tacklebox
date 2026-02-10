import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, typography, transitions } from '@/config/tokens'
import Badge from './Badge'

const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
  const containerStyles = {
    display: 'flex',
    borderBottom: `2px solid ${colours.neutral[200]}`,
    gap: spacing[1],
  }

  const getTabStyles = (isActive) => ({
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
    color: isActive ? colours.neutral[900] : colours.neutral[600],
    padding: `${spacing[3]} ${spacing[4]}`,
    borderBottom: `2px solid ${isActive ? colours.neutral[900] : 'transparent'}`,
    marginBottom: '-2px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    transition: `all ${transitions.normal}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  })

  return (
    <div style={containerStyles} className={className}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            style={getTabStyles(isActive)}
            onClick={() => onChange(tab.key)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = colours.neutral[900]
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = colours.neutral[600]
              }
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant={isActive ? 'primary' : 'neutral'} size="sm">
                {tab.count}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
}

export default Tabs
