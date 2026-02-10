import React from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography } from '@/config/tokens'
import { TASK_STATUSES, TASK_STATUS_LABELS } from '@/config/constants'

const StatusBadge = ({ status }) => {
  const statusColours = {
    [TASK_STATUSES.SUBMITTED]: {
      backgroundColor: colours.neutral[100],
      color: colours.neutral[700],
    },
    [TASK_STATUSES.ASSIGNED]: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[700],
    },
    [TASK_STATUSES.IN_PROGRESS]: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[900],
    },
    [TASK_STATUSES.REVIEW]: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[700],
    },
    [TASK_STATUSES.REVISION]: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[800],
    },
    [TASK_STATUSES.APPROVED]: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[700],
    },
    [TASK_STATUSES.CLOSED]: {
      backgroundColor: colours.neutral[300],
      color: colours.neutral[800],
    },
    [TASK_STATUSES.CANCELLED]: {
      backgroundColor: colours.neutral[200],
      color: colours.neutral[600],
    },
  }

  const badgeStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[1]} ${spacing[3]}`,
    borderRadius: radii.full,
    whiteSpace: 'nowrap',
    ...statusColours[status],
  }

  return <span style={badgeStyles}>{TASK_STATUS_LABELS[status] || status}</span>
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(Object.values(TASK_STATUSES)).isRequired,
}

export default StatusBadge
