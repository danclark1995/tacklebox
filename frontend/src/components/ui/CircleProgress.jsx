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

        {/* Centre text */}
        <text
          x={cx} y={cy - 20}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={48}
          fontWeight={700}
          fontFamily="Inter, -apple-system, sans-serif"
        >
          {currentLevel}
        </text>
        <text
          x={cx} y={cy + 8}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={14}
          fontWeight={400}
          fontFamily="Inter, -apple-system, sans-serif"
        >
          {displayLevels.find(l => l.level === currentLevel)?.name || ''}
        </text>
      </svg>

      {/* Centre FlameIcon overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, 8px)',
      }}>
        <FlameIcon level={currentLevel} size="md" animated />
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
