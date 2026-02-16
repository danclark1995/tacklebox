import { useState, useEffect } from 'react'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import EmberLoader from '@/components/ui/EmberLoader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import ConfirmAction from '@/components/ui/ConfirmAction'
import { listCategories, createCategory, updateCategory, deleteCategory, deactivateCategory } from '@/services/categories'
import { spacing } from '@/config/tokens'

export default function AdminCategories() {
  const { addToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_priority: 'medium',
    icon: ''
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await listCategories({ includeInactive: true })
      setCategories(data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
      default_priority: 'medium',
      icon: ''
    })
    setShowModal(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      default_priority: category.default_priority,
      icon: category.icon || ''
    })
    setShowModal(true)
  }

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      addToast('Category name is required', 'error')
      return
    }

    setSubmitting(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData)
        addToast('Category updated successfully', 'success')
      } else {
        await createCategory(formData)
        addToast('Category created successfully', 'success')
      }
      setShowModal(false)
      loadCategories()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCategory = async (category) => {
    try {
      await deleteCategory(category.id)
      addToast('Category deleted', 'success')
      loadCategories()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleDeactivateCategory = async (categoryId) => {
    try {
      await deactivateCategory(categoryId)
      addToast('Category deactivated successfully', 'success')
      loadCategories()
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

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (_, category) => category.name
    },
    {
      key: 'description',
      label: 'Description',
      render: (_, category) => category.description || '-'
    },
    {
      key: 'default_priority',
      label: 'Default Priority',
      render: (_, category) => (
        <Badge variant={category.default_priority === 'high' ? 'error' : category.default_priority === 'medium' ? 'warning' : 'info'}>
          {category.default_priority}
        </Badge>
      )
    },
    {
      key: 'icon',
      label: 'Icon',
      render: (_, category) => category.icon || '-'
    },
    {
      key: 'active',
      label: 'Status',
      render: (_, category) => (
        <Badge variant={category.active ? 'success' : 'neutral'}>
          {category.active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, category) => (
        <div style={{ display: 'flex', gap: spacing[2] }}>
          <Button size="sm" variant="secondary" onClick={() => handleEditCategory(category)}>
            Edit
          </Button>
          {category.active && (
            <ConfirmAction
              trigger={<Button size="sm" variant="danger">Deactivate</Button>}
              onConfirm={() => handleDeactivateCategory(category.id)}
              confirmVariant="danger"
              message="Deactivate this category?"
            />
          )}
          <ConfirmAction
            trigger={<Button size="sm" variant="danger">Delete</Button>}
            onConfirm={() => handleDeleteCategory(category)}
            confirmVariant="danger"
            message={`Delete "${category.name}"?`}
          />
        </div>
      )
    }
  ]

  const fieldStyle = {
    marginBottom: spacing[4],
  }

  return (
    <div>
      <PageHeader
        title="Task Categories"
        actions={
          <Button onClick={handleAddCategory}>Add Category</Button>
        }
      />

      <DataTable
        columns={columns}
        data={categories}
      />

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingCategory ? 'Edit Category' : 'Add Category'}
        >
          <div style={{ padding: spacing[4] }}>
            <div style={fieldStyle}>
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter category name"
                required
              />
            </div>

            <div style={fieldStyle}>
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter category description"
                rows={3}
              />
            </div>

            <div style={fieldStyle}>
              <Select
                label="Default Priority"
                value={formData.default_priority}
                onChange={(e) => setFormData({ ...formData, default_priority: e.target.value })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' }
                ]}
              />
            </div>

            <div style={fieldStyle}>
              <Input
                label="Icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Enter icon name or emoji"
              />
            </div>

            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end', marginTop: spacing[6] }}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
