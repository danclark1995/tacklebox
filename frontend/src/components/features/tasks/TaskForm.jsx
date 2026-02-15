import { useState, useEffect } from 'react'
import { Input, Textarea, Select, DatePicker, FileUpload, Button, Toggle } from '@/components/ui'
import { PRIORITIES, PRIORITY_LABELS, VALIDATION, SCALING_TIERS } from '@/config/constants'
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
  isAdmin = false,
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
    campfire_eligible: false,
    complexity_level: '',
    estimated_hours: '',
    hourly_rate: '',
    min_level: '1',
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
        campfire_eligible: !!initialData.campfire_eligible,
        complexity_level: initialData.complexity_level != null ? String(initialData.complexity_level) : '',
        estimated_hours: initialData.estimated_hours != null ? String(initialData.estimated_hours) : '',
        hourly_rate: initialData.hourly_rate != null ? String(initialData.hourly_rate) : '',
        min_level: initialData.min_level != null ? String(initialData.min_level) : '1',
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
        estimated_hours: template.estimated_hours ? String(template.estimated_hours) : prev.estimated_hours,
        hourly_rate: template.hourly_rate ? String(template.hourly_rate) : prev.hourly_rate,
        min_level: template.min_level ? String(template.min_level) : prev.min_level,
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

  const complexityOptions = [
    { value: '', label: 'Not set' },
    ...SCALING_TIERS.map(tier => ({
      value: String(tier.level),
      label: tier.level === 0
        ? 'Level 0 — AI Assist'
        : tier.rateMax === 0
          ? `Level ${tier.level} — ${tier.name} ($${tier.rateMin}+/hr)`
          : `Level ${tier.level} — ${tier.name} ($${tier.rateMin}–$${tier.rateMax}/hr)`,
    })),
  ]

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

      {/* Complexity Level (admin only) */}
      {isAdmin && (
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: colours.neutral[700],
            marginBottom: spacing[2],
          }}>
            Complexity Level
          </label>
          <Select
            value={formData.complexity_level}
            onChange={(e) => handleChange('complexity_level', e.target.value)}
            options={complexityOptions}
            disabled={loading}
          />
        </div>
      )}

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

      {/* Campfire (admin only) */}
      {isAdmin && (
        <div>
          <Toggle
            checked={formData.campfire_eligible}
            onChange={(val) => handleChange('campfire_eligible', val)}
            label="Send to Campfire"
            helperText="Available tasks appear at the campfire for campers to pick up"
            disabled={loading}
          />
        </div>
      )}

      {/* Pricing & Level (admin only) */}
      {isAdmin && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[4] }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: colours.neutral[700], marginBottom: spacing[2] }}>
                Estimated Hours
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.estimated_hours}
                onChange={(e) => handleChange('estimated_hours', e.target.value)}
                placeholder="e.g. 6"
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: colours.neutral[700], marginBottom: spacing[2] }}>
                Hourly Rate ($)
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                value={formData.hourly_rate}
                onChange={(e) => handleChange('hourly_rate', e.target.value)}
                placeholder="e.g. 20"
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: colours.neutral[700], marginBottom: spacing[2] }}>
                Total Payout
              </label>
              <div style={{
                padding: `${spacing[3]} ${spacing[4]}`, backgroundColor: colours.neutral[100],
                borderRadius: '6px', fontSize: '14px', fontWeight: 600,
                color: (formData.estimated_hours && formData.hourly_rate) ? colours.neutral[900] : colours.neutral[500],
              }}>
                {(formData.estimated_hours && formData.hourly_rate)
                  ? `$${(Number(formData.estimated_hours) * Number(formData.hourly_rate)).toFixed(2)}`
                  : '—'
                }
              </div>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: colours.neutral[700], marginBottom: spacing[2] }}>
              Minimum Level Required
            </label>
            <Select
              value={formData.min_level}
              onChange={(e) => handleChange('min_level', e.target.value)}
              options={[
                { value: '1', label: 'Level 1 — Volunteer (anyone)' },
                { value: '2', label: 'Level 2 — Apprentice' },
                { value: '3', label: 'Level 3 — Junior' },
                { value: '4', label: 'Level 4 — Intermediate' },
                { value: '5', label: 'Level 5 — Senior' },
                { value: '6', label: 'Level 6 — Specialist' },
                { value: '7', label: 'Level 7 — Camp Leader' },
                { value: '8', label: 'Level 8 — Guide' },
                { value: '9', label: 'Level 9 — Trailblazer' },
                { value: '10', label: 'Level 10 — Pioneer' },
                { value: '11', label: 'Level 11 — Legend' },
                { value: '12', label: 'Level 12 — Legacy' },
              ]}
              disabled={loading}
            />
          </div>
        </>
      )}

      {/* Credit cost display (for clients) */}
      {!isAdmin && formData.estimated_hours && formData.hourly_rate && (
        <div style={{
          padding: spacing[4],
          backgroundColor: colours.brand.primary + '08',
          border: `1px solid ${colours.brand.primary}25`,
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: colours.neutral[700], marginBottom: spacing[1] }}>
            Credit Cost
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: colours.brand.primary }}>
            {Math.round(Number(formData.estimated_hours) * Number(formData.hourly_rate)).toLocaleString()} credits
          </div>
          <div style={{ fontSize: '12px', color: colours.neutral[500], marginTop: spacing[1] }}>
            {formData.estimated_hours}hrs × ${formData.hourly_rate}/hr — deducted from your balance at submission
          </div>
        </div>
      )}

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
