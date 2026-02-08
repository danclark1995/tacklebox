import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, typography, transitions } from '@/config/tokens'
import Skeleton from './Skeleton'
import EmptyState from './EmptyState'

const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  className = '',
}) => {
  const [hoveredRow, setHoveredRow] = useState(null)

  const tableStyles = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontFamily: typography.fontFamily.sans,
  }

  const theadStyles = {
    backgroundColor: colours.neutral[50],
  }

  const thStyles = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[700],
    textAlign: 'left',
    padding: spacing[3],
    borderBottom: `1px solid ${colours.neutral[200]}`,
  }

  const tbodyStyles = {
    backgroundColor: colours.white,
  }

  const getTrStyles = (index) => ({
    cursor: onRowClick ? 'pointer' : 'default',
    backgroundColor: hoveredRow === index ? colours.neutral[50] : colours.white,
    transition: `background-color ${transitions.fast}`,
  })

  const tdStyles = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[900],
    padding: spacing[3],
    borderBottom: `1px solid ${colours.neutral[100]}`,
  }

  const containerStyles = {
    overflowX: 'auto',
    borderRadius: radii.lg,
    border: `1px solid ${colours.neutral[200]}`,
  }

  if (loading) {
    return (
      <div style={containerStyles} className={className}>
        <table style={tableStyles}>
          <thead style={theadStyles}>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={thStyles}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={tbodyStyles}>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} style={tdStyles}>
                    <Skeleton height="20px" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={containerStyles} className={className}>
        <EmptyState
          title={emptyMessage}
          description="Check back later or adjust your filters"
        />
      </div>
    )
  }

  return (
    <div style={containerStyles} className={className}>
      <table style={tableStyles}>
        <thead style={theadStyles}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={thStyles}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={tbodyStyles}>
          {data.map((row, index) => (
            <tr
              key={index}
              style={getTrStyles(index)}
              onClick={() => onRowClick && onRowClick(row)}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {columns.map((col) => (
                <td key={col.key} style={tdStyles}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func,
      sortable: PropTypes.bool,
    })
  ).isRequired,
  data: PropTypes.array,
  onRowClick: PropTypes.func,
  emptyMessage: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string,
}

export default DataTable
