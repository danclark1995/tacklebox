import { useState, useEffect } from 'react'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmberLoader from '@/components/ui/EmberLoader'
import UserTable from '@/components/features/users/UserTable'
import UserForm from '@/components/features/users/UserForm'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing } from '@/config/tokens'

export default function AdminUsers() {
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await fetch(apiEndpoint('/users'), { headers: { ...getAuthHeaders() } })
      const json = await res.json()
      if (json.success) setUsers(json.data)
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
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
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
      const res = await fetch(apiEndpoint(`/users/${userId}/deactivate`), {
        method: 'PATCH',
        headers: { ...getAuthHeaders() }
      })

      const json = await res.json()

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

  return (
    <div>
      <PageHeader
        title="Users"
        actions={
          <Button onClick={handleAddUser}>Add User</Button>
        }
      />

      <UserTable
        users={users}
        onEdit={handleEditUser}
        onDeactivate={handleDeactivateUser}
      />

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
