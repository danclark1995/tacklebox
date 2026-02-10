import React from 'react'
import PropTypes from 'prop-types'
import EmberLoader from '@/components/ui/EmberLoader'

const CampfireLayout = ({
  items = [],
  renderItem,
  centerContent,
  emptyMessage = 'Nothing at the campfire',
  maxVisible = 8,
}) => {
  const displayItems = items.slice(0, maxVisible)

  if (!items || items.length === 0) {
    return (
      <div style={emptyContainerStyle}>
        <EmberLoader size="md" text={emptyMessage} />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Campfire radial glow background */}
      <div style={glowBackgroundStyle} />

      {/* Centre content */}
      {centerContent && (
        <div style={centerStyle}>
          {centerContent}
        </div>
      )}

      {/* Items grid */}
      <div style={gridStyle}>
        {displayItems.map((item, index) => (
          <div key={index} style={itemStyle}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

const emptyContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '48px 24px',
}

const containerStyle = {
  position: 'relative',
  padding: '24px',
}

const glowBackgroundStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '300px',
  height: '300px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
  pointerEvents: 'none',
}

const centerStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '24px',
  position: 'relative',
  zIndex: 1,
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
  position: 'relative',
  zIndex: 1,
}

const itemStyle = {
  animation: 'fadeIn 300ms ease forwards',
}

CampfireLayout.propTypes = {
  items: PropTypes.array,
  renderItem: PropTypes.func.isRequired,
  centerContent: PropTypes.node,
  emptyMessage: PropTypes.string,
  maxVisible: PropTypes.number,
}

export default CampfireLayout
