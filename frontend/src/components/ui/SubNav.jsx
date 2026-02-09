import { colours, spacing, typography, transitions } from '@/config/tokens'

export default function SubNav({ tabs, activeTab, onChange }) {
  const containerStyle = {
    display: 'flex',
    gap: spacing[1],
    borderBottom: `1px solid ${colours.neutral[200]}`,
    marginBottom: spacing[6],
  }

  const tabStyle = (active) => ({
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: active ? typography.fontWeight.medium : typography.fontWeight.normal,
    color: active ? '#ffffff' : '#666666',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #ffffff' : '2px solid transparent',
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    marginBottom: '-1px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[1],
  })

  return (
    <div style={containerStyle}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          style={tabStyle(activeTab === tab.key)}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
