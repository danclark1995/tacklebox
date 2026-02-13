import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
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
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const PRIORITY_VARIANTS = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  urgent: 'error',
}

const INITIAL_FORM = {
  name: '',
  category_id: '',
  default_title: '',
  default_description: '',
  default_priority: 'medium',
  checklist: [],
}

export default function AdminTemplates() {
  const { addToast } = useToast()
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [formData, setFormData] = useState({ ...INITIAL_FORM })
  const [newChecklistItem, setNewChecklistItem] = useState('')

  useEffect(() => {
    loadCategories()
    loadTemplates()
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [filterCategory])

  const loadCategories = async () => {
    try {
      const res = await fetch(apiEndpoint('/categories'), {
        headers: { ...getAuthHeaders() },
      })
      const json = await res.json()
      if (json.success) {
        setCategories(json.data || [])
      }
    } catch (err) {
      addToast('Failed to load categories', 'error')
    }
  }

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const categoryParam = filterCategory ? `?category_id=${filterCategory}` : ''
      const res = await fetch(apiEndpoint(`/templates${categoryParam}`), {
        headers: { ...getAuthHeaders() },
      })
      const json = await res.json()
      if (json.success) {
        setTemplates(json.data || [])
      }
    } catch (err) {
      addToast('Failed to load templates', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setFormData({ ...INITIAL_FORM })
    setNewChecklistItem('')
    setShowModal(true)
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)

    let checklist = []
    if (template.checklist) {
      try {
        checklist = typeof template.checklist === 'string'
          ? JSON.parse(template.checklist)
          : template.checklist
      } catch {
        checklist = []
      }
    }

    setFormData({
      name: template.name || '',
      category_id: template.category_id || '',
      default_title: template.default_title || '',
      default_description: template.default_description || '',
      default_priority: template.default_priority || 'medium',
      checklist: Array.isArray(checklist) ? checklist : [],
    })
    setNewChecklistItem('')
    setShowModal(true)
  }

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      addToast('Template name is required', 'error')
      return
    }
    if (!formData.category_id) {
      addToast('Category is required', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = editingTemplate
        ? apiEndpoint(`/templates/${editingTemplate.id}`)
        : apiEndpoint('/templates')

      const method = editingTemplate ? 'PUT' : 'POST'

      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        default_title: formData.default_title || null,
        default_description: formData.default_description || null,
        default_priority: formData.default_priority || null,
        checklist: formData.checklist.length > 0 ? formData.checklist : null,
      }

      const res = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (json.success) {
        addToast(
          editingTemplate ? 'Template updated successfully' : 'Template created successfully',
          'success'
        )
        setShowModal(false)
        loadTemplates()
      } else {
        addToast(json.error || 'Failed to save template', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return
    try {
      const res = await fetch(apiEndpoint(`/templates/${template.id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      })
      const json = await res.json()
      if (json.success) {
        addToast('Template deleted', 'success')
        loadTemplates()
      } else {
        addToast(json.error || 'Failed to delete template', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleToggleActive = async (template) => {
    const newActive = !template.is_active
    try {
      const res = await fetch(apiEndpoint(`/templates/${template.id}`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newActive }),
      })

      const json = await res.json()

      if (json.success) {
        addToast(
          newActive ? 'Template activated' : 'Template deactivated',
          'success'
        )
        loadTemplates()
      } else {
        addToast(json.error || 'Failed to update template', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    setFormData({
      ...formData,
      checklist: [...formData.checklist, newChecklistItem.trim()],
    })
    setNewChecklistItem('')
  }

  const handleRemoveChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index),
    })
  }

  const handleChecklistKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddChecklistItem()
    }
  }

  // Loading state
  if (loading && templates.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }))

  const filterOptions = [
    { value: '', label: 'All Categories' },
    ...categoryOptions,
  ]

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => (
        <span style={{ fontWeight: typography.fontWeight.medium }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'category_name',
      label: 'Category',
      render: (_, row) => row.category_name || '-',
    },
    {
      key: 'default_title',
      label: 'Default Title',
      render: (_, row) => row.default_title || '-',
    },
    {
      key: 'default_priority',
      label: 'Default Priority',
      render: (_, row) =>
        row.default_priority ? (
          <Badge variant={PRIORITY_VARIANTS[row.default_priority] || 'neutral'}>
            {row.default_priority}
          </Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (_, row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              handleEditTemplate(row)
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={row.is_active ? 'danger' : 'primary'}
            onClick={(e) => {
              e.stopPropagation()
              handleToggleActive(row)
            }}
          >
            {row.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteTemplate(row)
            }}
            icon={<Trash2 size={14} />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const fieldStyle = {
    marginBottom: spacing[4],
  }

  const checklistContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  }

  const checklistLabelStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[700],
    marginBottom: spacing[1],
  }

  const checklistItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colours.neutral[50],
    borderRadius: radii.md,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.sans,
    color: colours.neutral[800],
  }

  const checklistRemoveStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colours.neutral[400],
    display: 'flex',
    alignItems: 'center',
    padding: spacing[1],
    borderRadius: radii.sm,
    transition: `color ${transitions.fast}`,
    marginLeft: 'auto',
    flexShrink: 0,
  }

  const checklistInputRowStyle = {
    display: 'flex',
    gap: spacing[2],
    alignItems: 'center',
  }

  const checklistInputStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    flex: 1,
    padding: `${spacing[2]} ${spacing[3]}`,
    height: '36px',
    borderRadius: radii.md,
    border: `1px solid ${colours.neutral[300]}`,
    backgroundColor: colours.white,
    color: colours.neutral[900],
    outline: 'none',
  }

  return (
    <div>
      <PageHeader
        title="Task Templates"
        actions={
          <Button onClick={handleCreateTemplate}>Create Template</Button>
        }
      />

      {/* Filter by category */}
      <div style={{ marginBottom: spacing[4], maxWidth: '300px' }}>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          options={filterOptions}
          placeholder=""
        />
      </div>

      <DataTable
        columns={columns}
        data={templates}
        loading={loading}
        emptyMessage="No templates found"
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingTemplate ? 'Edit Template' : 'Create Template'}
          size="lg"
        >
          <div>
            <div style={fieldStyle}>
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter template name"
                required
              />
            </div>

            <div style={fieldStyle}>
              <Select
                label="Category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                options={categoryOptions}
                placeholder="Select a category"
                required
              />
            </div>

            <div style={fieldStyle}>
              <Input
                label="Default Title"
                value={formData.default_title}
                onChange={(e) => setFormData({ ...formData, default_title: e.target.value })}
                placeholder="Default task title (optional)"
              />
            </div>

            <div style={fieldStyle}>
              <Textarea
                label="Default Description"
                value={formData.default_description}
                onChange={(e) => setFormData({ ...formData, default_description: e.target.value })}
                placeholder="Default task description (optional)"
                rows={3}
              />
            </div>

            <div style={fieldStyle}>
              <Select
                label="Default Priority"
                value={formData.default_priority}
                onChange={(e) => setFormData({ ...formData, default_priority: e.target.value })}
                options={PRIORITY_OPTIONS}
              />
            </div>

            {/* Checklist items */}
            <div style={fieldStyle}>
              <div style={checklistContainerStyle}>
                <div style={checklistLabelStyle}>Checklist Items</div>

                {formData.checklist.map((item, index) => (
                  <div key={index} style={checklistItemStyle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colours.neutral[400]} strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                    <span style={{ flex: 1 }}>{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveChecklistItem(index)}
                      style={{ marginLeft: 'auto', flexShrink: 0, padding: spacing[1] }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </Button>
                  </div>
                ))}

                <div style={checklistInputRowStyle}>
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={handleChecklistKeyPress}
                    placeholder="Add a checklist item..."
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddChecklistItem}
                    disabled={!newChecklistItem.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end', marginTop: spacing[6] }}>
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} loading={submitting}>
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
