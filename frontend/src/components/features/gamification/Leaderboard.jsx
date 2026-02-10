import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const Leaderboard = ({ entries = [], currentUserId, compact = false }) => {
  if (!entries || entries.length === 0) return null

  let displayEntries = entries
  if (compact) {
    const top5 = entries.slice(0, 5)
    const currentUserEntry = entries.find(e => String(e.user_id) === String(currentUserId))
    if (currentUserEntry && !top5.find(e => String(e.user_id) === String(currentUserId))) {
      displayEntries = [...top5, currentUserEntry]
    } else {
      displayEntries = top5
    }
  }

  return (
    <div style={containerStyle(compact)}>
      <table style={tableStyle}>
        <thead>
          <tr style={theadRowStyle}>
            <th style={{ ...thStyle, width: '60px' }}>Rank</th>
            <th style={thStyle}>Name</th>
            {!compact && <th style={thStyle}>Level</th>}
            <th style={{ ...thStyle, textAlign: 'right' }}>XP</th>
            {!compact && <th style={{ ...thStyle, textAlign: 'right' }}>Tasks</th>}
          </tr>
        </thead>
        <tbody>
          {displayEntries.map((entry, index) => {
            const isCurrentUser = String(entry.user_id) === String(currentUserId)
            const showGap = compact && index === 5

            return (
              <React.Fragment key={entry.user_id}>
                {showGap && (
                  <tr>
                    <td colSpan={compact ? 3 : 5} style={gapRowStyle}>
                      &middot;&middot;&middot;
                    </td>
                  </tr>
                )}
                <tr
                  style={{
                    ...trStyle,
                    backgroundColor: isCurrentUser
                      ? colours.neutral[100]
                      : 'transparent',
                  }}
                >
                  <td style={{
                    ...tdStyle,
                    fontWeight: typography.fontWeight.bold,
                    color: colours.neutral[900],
                  }}>
                    #{entry.rank}
                  </td>

                  <td style={{
                    ...tdStyle,
                    fontWeight: isCurrentUser
                      ? typography.fontWeight.bold
                      : typography.fontWeight.medium,
                    color: colours.neutral[900],
                  }}>
                    {entry.display_name}
                    {isCurrentUser && (
                      <span style={youLabelStyle}> (You)</span>
                    )}
                  </td>

                  {!compact && (
                    <td style={{ ...tdStyle, color: colours.neutral[600] }}>
                      {entry.level_name || `Level ${entry.current_level}`}
                    </td>
                  )}

                  <td style={{
                    ...tdStyle,
                    textAlign: 'right',
                    fontWeight: typography.fontWeight.semibold,
                    color: colours.neutral[800],
                  }}>
                    {(entry.total_xp || 0).toLocaleString()}
                  </td>

                  {!compact && (
                    <td style={{
                      ...tdStyle,
                      textAlign: 'right',
                      color: colours.neutral[600],
                    }}>
                      {entry.tasks_completed ?? '-'}
                    </td>
                  )}
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const containerStyle = (compact) => ({
  overflowX: 'auto',
  borderRadius: compact ? 0 : radii.lg,
  border: compact ? 'none' : `1px solid ${colours.neutral[200]}`,
})

const tableStyle = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontFamily: typography.fontFamily.sans,
}

const theadRowStyle = {
  backgroundColor: colours.neutral[50],
}

const thStyle = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[700],
  textAlign: 'left',
  padding: spacing[3],
  borderBottom: `1px solid ${colours.neutral[200]}`,
}

const trStyle = {
  transition: `background-color ${transitions.fast}`,
}

const tdStyle = {
  fontSize: typography.fontSize.sm,
  padding: spacing[3],
  borderBottom: `1px solid ${colours.neutral[100]}`,
}

const gapRowStyle = {
  textAlign: 'center',
  padding: spacing[2],
  color: colours.neutral[400],
  fontSize: typography.fontSize.sm,
  letterSpacing: '4px',
  borderBottom: `1px solid ${colours.neutral[100]}`,
}

const youLabelStyle = {
  fontSize: typography.fontSize.xs,
  color: colours.neutral[500],
  fontWeight: typography.fontWeight.normal,
}

Leaderboard.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      rank: PropTypes.number.isRequired,
      user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      display_name: PropTypes.string.isRequired,
      total_xp: PropTypes.number,
      current_level: PropTypes.number,
      level_name: PropTypes.string,
      tasks_completed: PropTypes.number,
    })
  ),
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  compact: PropTypes.bool,
}

export default Leaderboard
