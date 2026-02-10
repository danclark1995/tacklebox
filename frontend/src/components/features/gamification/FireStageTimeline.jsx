import React from 'react'
import PropTypes from 'prop-types'
import FlameIcon from '@/components/ui/FlameIcon'
import { colours, spacing, typography, radii } from '@/config/tokens'
import { FIRE_STAGES } from '@/config/constants'

const FireStageTimeline = ({ currentStage, currentLevel = 1 }) => {
  const stages = FIRE_STAGES
  const currentIndex = stages.indexOf(currentStage)

  return (
    <div style={containerStyle}>
      <div style={scrollWrapperStyle}>
        <div style={timelineStyle}>
          {stages.map((stage, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isFuture = index > currentIndex

            const staggerDelay = isCompleted ? `${index * 200}ms` : '0ms'

            return (
              <div key={stage} style={stageItemStyle}>
                {/* Connector line (before node, except first) */}
                {index > 0 && (
                  <div style={{
                    ...connectorStyle,
                    backgroundColor: isFuture ? 'transparent' : '#ffffff',
                    opacity: isCompleted ? 0.5 : isCurrent ? 0.3 : 0.1,
                    borderTop: isFuture
                      ? '1px dashed rgba(255, 255, 255, 0.15)'
                      : 'none',
                  }} />
                )}

                {/* Flame icon above current node */}
                {isCurrent && (
                  <div style={flameAboveStyle}>
                    <FlameIcon level={currentLevel} size="sm" animated />
                  </div>
                )}

                {/* Node */}
                <div
                  style={{
                    ...nodeStyle,
                    width: isCurrent ? '18px' : '12px',
                    height: isCurrent ? '18px' : '12px',
                    backgroundColor: isFuture ? 'transparent' : '#ffffff',
                    border: isFuture
                      ? '1.5px solid rgba(255, 255, 255, 0.25)'
                      : isCurrent
                        ? '2px solid #ffffff'
                        : 'none',
                    boxShadow: isCurrent
                      ? '0 0 16px rgba(255, 255, 255, 0.3), 0 0 32px rgba(255, 255, 255, 0.1)'
                      : 'none',
                    animation: isCurrent ? 'glowPulse 2s ease-in-out infinite' : isCompleted ? `fadeIn 400ms ease ${staggerDelay} both` : 'none',
                  }}
                />

                {/* Label */}
                <div style={{
                  ...labelStyle,
                  color: isFuture
                    ? 'rgba(255, 255, 255, 0.35)'
                    : '#ffffff',
                  fontWeight: isCurrent
                    ? typography.fontWeight.bold
                    : typography.fontWeight.normal,
                  opacity: isFuture ? 0.35 : 1,
                  animation: isCompleted ? `fadeIn 400ms ease ${staggerDelay} both` : 'none',
                }}>
                  {stage}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const containerStyle = {
  width: '100%',
  overflow: 'hidden',
}

const scrollWrapperStyle = {
  overflowX: 'auto',
  paddingBottom: spacing[2],
  WebkitOverflowScrolling: 'touch',
}

const timelineStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  minWidth: '700px',
  padding: `${spacing[8]} ${spacing[4]} ${spacing[4]}`,
  position: 'relative',
}

const stageItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
  position: 'relative',
  minWidth: '80px',
}

const connectorStyle = {
  position: 'absolute',
  top: '6px',
  right: '50%',
  width: '100%',
  height: '1px',
  zIndex: 0,
}

const nodeStyle = {
  borderRadius: '50%',
  zIndex: 1,
  flexShrink: 0,
  transition: 'all 200ms ease',
}

const flameAboveStyle = {
  position: 'absolute',
  top: '-32px',
  left: '50%',
  transform: 'translateX(-50%)',
}

const labelStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: '11px',
  textAlign: 'center',
  marginTop: spacing[2],
  lineHeight: 1.3,
  maxWidth: '90px',
  whiteSpace: 'nowrap',
}

FireStageTimeline.propTypes = {
  currentStage: PropTypes.string,
  currentLevel: PropTypes.number,
}

export default FireStageTimeline
