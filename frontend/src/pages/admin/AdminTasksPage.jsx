import { useState } from 'react'
import SubNav from '@/components/ui/SubNav'
import AdminTasks from './AdminTasks'
import AdminTemplates from './AdminTemplates'
import AdminCategories from './AdminCategories'
import { spacing } from '@/config/tokens'

const TABS = [
  { key: 'tasks', label: 'All Tasks' },
  { key: 'templates', label: 'Templates' },
  { key: 'categories', label: 'Categories' },
]

export default function AdminTasksPage() {
  const [activeTab, setActiveTab] = useState('tasks')

  return (
    <div>
      <SubNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'tasks' && <AdminTasks />}
      {activeTab === 'templates' && <AdminTemplates />}
      {activeTab === 'categories' && <AdminCategories />}
    </div>
  )
}
