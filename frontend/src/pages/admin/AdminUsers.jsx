import { useState, useEffect } from 'react'

import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmberLoader from '@/components/ui/EmberLoader'
import SubNav from '@/components/ui/SubNav'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import UserForm from '@/components/features/users/UserForm'
import { apiEndpoint } from '@/config/env'
import { listUsers, deactivateUser } from '@/services/users'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'
import { formatDateTime } from '@/utils/formatters'

const TABS = [
  { key: 'campers', label: 'Campers' },
  { key: 'clients', label: 'Clients' },
]

export default function AdminUsers() {
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('campers')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setShowModal(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setShowModal(true)
  }

  const handleSaveUser = async (userData) => {
    setSubmitting(true)
    try {
      const url = editingUser
        ? apiEndpoint(`/users/${editingUser.id}`)
        : apiEndpoint('/users')
      const method = editingUser ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      const json = await res.json()
      if (json.success) {
        addToast(editingUser ? 'User updated successfully' : 'User created successfully', 'success')
        setShowModal(false)
        loadUsers()
      } else {
        addToast(json.message || 'Failed to save user', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivateUser = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return
    try {
      const data = await deactivateUser(userId)
      if (json.success) {
        addToast('User deactivated successfully', 'success')
        loadUsers()
      } else {
        addToast(json.message || 'Failed to deactivate user', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  const searchLower = search.toLowerCase()
  const campers = users.filter(u =>
    (u.role === 'contractor' || u.role === 'admin') &&
    (!search || (u.display_name || '').toLowerCase().includes(searchLower) || (u.email || '').toLowerCase().includes(searchLower))
  )
  const clients = users.filter(u =>
    u.role === 'client' &&
    (!search || (u.display_name || '').toLowerCase().includes(searchLower) || (u.email || '').toLowerCase().includes(searchLower))
  )

  const camperColumns = [
    {
      key: 'user',
      label: 'Name',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar src={row.avatar_url} name={row.display_name} size="sm" />
          <span style={{ fontWeight: 500, color: colours.neutral[900] }}>
            {row.display_name}
            {row.role === 'admin' && (
              <span style={{
                marginLeft: '8px',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid #333',
                color: colours.neutral[500],
              }}>
                Admin
              </span>
            )}
          </span>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (_, row) => <span style={{ fontSize: '13px', color: colours.neutral[600] }}>{row.email}</span> },
    { key: 'level', label: 'Level', render: (_, row) => <span style={{ color: colours.neutral[900] }}>{row.current_level ? `L${row.current_level}` : '-'}{row.level_name ? ` · ${row.level_name}` : ''}</span> },
    { key: 'xp', label: 'XP', render: (_, row) => <span style={{ color: colours.neutral[900] }}>{(row.total_xp || 0).toLocaleString()}</span> },
    { key: 'tasks_completed', label: 'Tasks', render: (_, row) => <span style={{ color: colours.neutral[900] }}>{row.tasks_completed || 0}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <Badge variant={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => handleEditUser(row)}>Edit</Button>
          {row.is_active && row.role !== 'admin' && (
            <Button variant="warning" size="sm" onClick={() => handleDeactivateUser(row.id)}>Deactivate</Button>
          )}
        </div>
      ),
    },
  ]

  const clientColumns = [
    {
      key: 'user',
      label: 'Name',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar src={row.avatar_url} name={row.display_name} size="sm" />
          <span style={{ fontWeight: 500, color: colours.neutral[900] }}>{row.display_name}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (_, row) => <span style={{ fontSize: '13px', color: colours.neutral[600] }}>{row.email}</span> },
    { key: 'company', label: 'Company', render: (_, row) => <span style={{ color: colours.neutral[900] }}>{row.company || '-'}</span> },
    { key: 'task_count', label: 'Active Tasks', render: (_, row) => <span style={{ color: colours.neutral[900] }}>{row.task_count || 0}</span> },
    {
      key: 'brand',
      label: 'Brand Profile',
      render: (_, row) => <span style={{ color: colours.neutral[600] }}>{row.has_brand_profile ? 'Yes' : 'No'}</span>,
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (_, row) => <span style={{ fontSize: '13px', color: colours.neutral[600] }}>{formatDateTime(row.created_at)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => handleEditUser(row)}>Edit</Button>
          {row.is_active && (
            <Button variant="warning" size="sm" onClick={() => handleDeactivateUser(row.id)}>Deactivate</Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={activeTab === 'campers' ? 'Campers' : 'Clients'}
        actions={<Button onClick={handleAddUser}>Add User</Button>}
      />

      <SubNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div style={{ marginBottom: spacing[4], maxWidth: '320px' }}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
        />
      </div>

      {activeTab === 'campers' && (
        <DataTable columns={camperColumns} data={campers} emptyMessage="No campers found" />
      )}
      {activeTab === 'clients' && (
        <DataTable columns={clientColumns} data={clients} emptyMessage="No clients found" />
      )}

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? 'Edit User' : 'Add User'}
        >
          <div style={{ padding: spacing[4] }}>
            <UserForm
              user={editingUser}
              onSubmit={handleSaveUser}
              onCancel={() => setShowModal(false)}
              isSubmitting={submitting}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
