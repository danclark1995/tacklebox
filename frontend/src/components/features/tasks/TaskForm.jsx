import { useState, useEffect } from 'react'
import { Input, Textarea, Select, DatePicker, FileUpload, Button } from '@/components/ui'
import { PRIORITIES, PRIORITY_LABELS, VALIDATION } from '@/config/constants'
import { colours, spacing } from '@/config/tokens'

/**
 * TaskForm
 *
 * Task creation/edit form.
 * Fields: project, category, template (optional), title, description, priority, deadline, attachments.
 * When template selected, pre-fills title, description, priority.
 * Inline validation. Submit button with loading state.
 */
export default function TaskForm({
  onSubmit,
  projects = [],
  categories = [],
  templates = [],
  initialData = null,
  loading = false,
  clientId = null,
}) {
  const [formData, setFormData] = useState({
    project_id: '',
    category_id: '',
    template_id: '',
    title: '',
    description: '',
    priority: PRIORITIES.MEDIUM,
    deadline: '',
    attachments: [],
  })

  const [errors, setErrors] = useState({})
  const [filteredTemplates, setFilteredTemplates] = useState([])

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        project_id: initialData.project_id || '',
        category_id: initialData.category_id || '',
        template_id: initialData.template_id || '',
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || PRIORITIES.MEDIUM,
        deadline: initialData.deadline || '',
        attachments: [],
      })
    }
  }, [initialData])

  // Filter templates by selected category
  useEffect(() => {
    if (formData.category_id) {
      const filtered = templates.filter(t => t.category_id === formData.category_id && t.is_active)
      setFilteredTemplates(filtered)
    } else {
      setFilteredTemplates([])
    }
  }, [formData.category_id, templates])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        title: template.default_title || prev.title,
        description: template.default_description || prev.description,
        priority: template.default_priority || prev.priority,
      }))
    } else {
      setFormData(prev => ({ ...prev, template_id: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.project_id) {
      newErrors.project_id = 'Project is required'
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required'
    }
    if (!formData.title || formData.title.trim().length < VALIDATION.TASK_TITLE_MIN) {
      newErrors.title = `Title must be at least ${VALIDATION.TASK_TITLE_MIN} characters`
    }
    if (formData.title && formData.title.length > VALIDATION.TASK_TITLE_MAX) {
      newErrors.title = `Title must be less than ${VALIDATION.TASK_TITLE_MAX} characters`
    }
    if (!formData.description || formData.description.trim().length < VALIDATION.TASK_DESCRIPTION_MIN) {
      newErrors.description = `Description must be at least ${VALIDATION.TASK_DESCRIPTION_MIN} characters`
    }
    if (!formData.priority) {
      newErrors.priority = 'Priority is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate() && onSubmit) {
      onSubmit(formData)
    }
  }

  const priorityOptions = Object.values(PRIORITIES).map(priority => ({
    value: priority,
    label: PRIORITY_LABELS[priority],
  }))

  const projectOptions = projects.map(p => ({ value: p.id, label: p.name }))
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const templateOptions = [
    { value: '', label: 'No template' },
    ...filteredTemplates.map(t => ({ value: t.id, label: t.name })),
  ]

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
      {/* Project */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Project <span style={{ color: colours.neutral[700] }}>*</span>
        </label>
        <Select
          value={formData.project_id}
          onChange={(e) => handleChange('project_id', e.target.value)}
          options={projectOptions}
          placeholder="Select project"
          disabled={loading}
        />
        {errors.project_id && (
          <span style={{ color: colours.neutral[700], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.project_id}
          </span>
        )}
      </div>

      {/* Category */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Category <span style={{ color: colours.neutral[700] }}>*</span>
        </label>
        <Select
          value={formData.category_id}
          onChange={(e) => handleChange('category_id', e.target.value)}
          options={categoryOptions}
          placeholder="Select category"
          disabled={loading}
        />
        {errors.category_id && (
          <span style={{ color: colours.neutral[700], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.category_id}
          </span>
        )}
      </div>

      {/* Template (optional, shows when category selected) */}
      {filteredTemplates.length > 0 && (
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: colours.neutral[700],
            marginBottom: spacing[2],
          }}>
            Template (optional)
          </label>
          <Select
            value={formData.template_id}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            options={templateOptions}
            disabled={loading}
          />
        </div>
      )}

      {/* Title */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Title <span style={{ color: colours.neutral[700] }}>*</span>
        </label>
        <Input
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Social media graphics for January campaign"
          disabled={loading}
        />
        {errors.title && (
          <span style={{ color: colours.neutral[700], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.title}
          </span>
        )}
      </div>

      {/* Description */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Description <span style={{ color: colours.neutral[700] }}>*</span>
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Provide detailed requirements..."
          rows={6}
          disabled={loading}
        />
        {errors.description && (
          <span style={{ color: colours.neutral[700], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.description}
          </span>
        )}
      </div>

      {/* Priority */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Priority <span style={{ color: colours.neutral[700] }}>*</span>
        </label>
        <Select
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          options={priorityOptions}
          disabled={loading}
        />
        {errors.priority && (
          <span style={{ color: colours.neutral[700], fontSize: '13px', marginTop: spacing[1], display: 'block' }}>
            {errors.priority}
          </span>
        )}
      </div>

      {/* Deadline */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Deadline (optional)
        </label>
        <DatePicker
          value={formData.deadline}
          onChange={(value) => handleChange('deadline', value)}
          disabled={loading}
        />
      </div>

      {/* Attachments */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: colours.neutral[700],
          marginBottom: spacing[2],
        }}>
          Attachments (optional)
        </label>
        <FileUpload
          onFilesChange={(files) => handleChange('attachments', files)}
          multiple
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <div style={{ marginTop: spacing[2] }}>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Submitting...' : initialData ? 'Update Task' : 'Submit Task'}
        </Button>
      </div>
    </form>
  )
}
