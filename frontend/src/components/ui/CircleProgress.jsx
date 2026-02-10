import React from 'react'
import PropTypes from 'prop-types'
import FlameIcon from './FlameIcon'

const CircleProgress = ({
  currentLevel = 1,
  levels = [],
  size = 320,
  showLabels = true,
  className = '',
}) => {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 60

  // 12 points arranged clock-face: level 12 at top (12 o'clock), level 1 at 1 o'clock, etc.
  const getPoint = (level) => {
    // Level 12 at top (0 degrees), then clockwise
    const clockPos = level === 12 ? 0 : level
    const angle = (clockPos * 30 - 90) * (Math.PI / 180)
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  }

  const getLabelPos = (level) => {
    const clockPos = level === 12 ? 0 : level
    const angle = (clockPos * 30 - 90) * (Math.PI / 180)
    const labelRadius = radius + 32
    return {
      x: cx + labelRadius * Math.cos(angle),
      y: cy + labelRadius * Math.sin(angle),
    }
  }

  const displayLevels = levels.length > 0
    ? levels
    : Array.from({ length: 12 }, (_, i) => ({ level: i + 1, name: `Level ${i + 1}` }))

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Glow filter */}
        <defs>
          <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#ffffff" floodOpacity="0.3" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-bright" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#ffffff" floodOpacity="0.5" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connecting lines */}
        {displayLevels.map((lvl, i) => {
          const nextLvl = displayLevels[(i + 1) % 12]
          const p1 = getPoint(lvl.level)
          const p2 = getPoint(nextLvl.level)

          const bothCompleted = lvl.level < currentLevel && nextLvl.level < currentLevel
          const isCurrent = lvl.level === currentLevel || nextLvl.level === currentLevel
          const bothFuture = lvl.level > currentLevel && nextLvl.level > currentLevel

          let opacity = 0.1
          let dashArray = '4 4'
          if (bothCompleted) { opacity = 0.5; dashArray = 'none' }
          else if (isCurrent) { opacity = 0.3; dashArray = '4 4' }
          else if (bothFuture) { opacity = 0.08; dashArray = '2 4' }

          return (
            <line
              key={`line-${lvl.level}`}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke="#ffffff"
              strokeOpacity={opacity}
              strokeWidth={1}
              strokeDasharray={dashArray}
            />
          )
        })}

        {/* Points */}
        {displayLevels.map((lvl) => {
          const point = getPoint(lvl.level)
          const isCompleted = lvl.level < currentLevel
          const isCurrent = lvl.level === currentLevel
          const isFuture = lvl.level > currentLevel

          if (isCurrent) {
            return (
              <circle
                key={`point-${lvl.level}`}
                cx={point.x} cy={point.y}
                r={12}
                fill="#ffffff"
                filter="url(#glow-bright)"
                style={{ animation: 'glowPulse 2s ease-in-out infinite' }}
              />
            )
          }
          if (isCompleted) {
            return (
              <circle
                key={`point-${lvl.level}`}
                cx={point.x} cy={point.y}
                r={8}
                fill="#ffffff"
                filter="url(#glow-soft)"
              />
            )
          }
          return (
            <circle
              key={`point-${lvl.level}`}
              cx={point.x} cy={point.y}
              r={6}
              fill="transparent"
              stroke="#ffffff"
              strokeWidth={1}
              opacity={0.3}
            />
          )
        })}

        {/* Labels */}
        {showLabels && displayLevels.map((lvl) => {
          const pos = getLabelPos(lvl.level)
          const isCurrent = lvl.level === currentLevel
          const isCompleted = lvl.level < currentLevel
          const isFuture = lvl.level > currentLevel

          const clockPos = lvl.level === 12 ? 0 : lvl.level
          const anchor = clockPos > 0 && clockPos < 6 ? 'start'
            : clockPos > 6 ? 'end'
            : 'middle'

          return (
            <text
              key={`label-${lvl.level}`}
              x={pos.x}
              y={pos.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={isCurrent ? 11 : 10}
              fontWeight={isCurrent ? 700 : 400}
              opacity={isFuture ? 0.4 : 1}
              fontFamily="Inter, -apple-system, sans-serif"
            >
              {lvl.name}
            </text>
          )
        })}

      </svg>

      {/* Centre campfire */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          borderRadius: '50%',
          boxShadow: '0 0 40px rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <FlameIcon level={currentLevel} size="lg" animated />
        </div>
        <div style={{
          marginTop: '-2px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
        }}>
          <div style={{ width: '28px', height: '2px', backgroundColor: '#ffffff', opacity: 0.3, transform: 'rotate(-20deg)', borderRadius: '1px' }} />
          <div style={{ width: '24px', height: '2px', backgroundColor: '#ffffff', opacity: 0.25, transform: 'rotate(15deg)', borderRadius: '1px' }} />
          <div style={{ width: '22px', height: '2px', backgroundColor: '#ffffff', opacity: 0.2, transform: 'rotate(-8deg)', borderRadius: '1px' }} />
        </div>
      </div>
    </div>
  )
}

CircleProgress.propTypes = {
  currentLevel: PropTypes.number,
  levels: PropTypes.arrayOf(PropTypes.shape({
    level: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
  })),
  size: PropTypes.number,
  showLabels: PropTypes.bool,
  className: PropTypes.string,
}

export default CircleProgress
