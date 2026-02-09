import { useState } from 'react'
import SubNav from '@/components/ui/SubNav'
import CreateHub from '@/pages/create/CreateHub'
import MyCreations from '@/pages/create/MyCreations'
import AdminAnalytics from './AdminAnalytics'
import { spacing, typography, colours } from '@/config/tokens'

const TABS = [
  { key: 'assistant', label: 'AI Assistant' },
  { key: 'generations', label: 'Generations' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'toolbox', label: 'Toolbox' },
]

export default function AdminToolsPage() {
  const [activeTab, setActiveTab] = useState('assistant')

  const placeholderStyle = {
    textAlign: 'center',
    padding: spacing[12],
    color: colours.neutral[500],
    fontSize: typography.fontSize.sm,
  }

  return (
    <div>
      <SubNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'assistant' && <CreateHub />}
      {activeTab === 'generations' && <MyCreations />}
      {activeTab === 'analytics' && <AdminAnalytics />}
      {activeTab === 'toolbox' && (
        <div style={placeholderStyle}>
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[700], marginBottom: spacing[2] }}>
            Toolbox
          </div>
          <div>Additional tools and utilities coming soon.</div>
        </div>
      )}
    </div>
  )
}
