import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Button, Select, DatePicker, Textarea, EmptyState, Spinner } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import { TIME_DURATION_OPTIONS, VALIDATION } from '@/config/constants'
import { formatDate, formatDuration } from '@/utils/formatters'
import { colours, spacing, radii, typography, shadows } from '@/config/tokens'

/**
 * TimeLogSection
 *
 * Full time tracking section for the Task Detail view.
 * Displays a time log header with totals, an inline entry form for
 * contractors and admins, and a list of all time entries with
 * edit/delete capabilities for entry authors and admins.
 */

const durationOptions = TIME_DURATION_OPTIONS.map(opt => ({
  value: String(opt.value),
  label: opt.label,
}))

function getTodayISO() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDateISO(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTotalTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

// ── Inline Entry Form ────────────────────────────────────────────────
function TimeEntryForm({ initialData, onSave, onCancel, taskCreatedAt, loading }) {
  const [date, setDate] = useState(initialData?.date ? toDateISO(initialData.date) : getTodayISO())
  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.duration_minutes ? String(initialData.duration_minutes) : ''
  )
  const [description, setDescription] = useState(initialData?.description || '')
  const [errors, setErrors] = useState({})

  const minDate = taskCreatedAt ? toDateISO(taskCreatedAt) : ''
  const maxDate = getTodayISO()

  const validate = () => {
    const newErrors = {}

    if (!date) {
      newErrors.date = 'Date is required'
    } else {
      if (maxDate && date > maxDate) {
        newErrors.date = 'Date cannot be in the future'
      }
      if (minDate && date < minDate) {
        newErrors.date = 'Date cannot be before task creation'
      }
    }

    if (!durationMinutes) {
      newErrors.duration_minutes = 'Duration is required'
    }

    if (!description || description.trim().length < VALIDATION.TIME_DESCRIPTION_MIN) {
      newErrors.description = `Description must be at least ${VALIDATION.TIME_DESCRIPTION_MIN} characters`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validate()) {
      onSave({
        date,
        duration_minutes: Number(durationMinutes),
        description: description.trim(),
      })
    }
  }

  const formStyles = {
    padding: spacing[4],
    backgroundColor: colours.neutral[50],
    borderRadius: radii.md,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    marginBottom: spacing[4],
  }

  const rowStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing[4],
  }

  return (
    <div style={formStyles}>
      <div style={rowStyles}>
        <DatePicker
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={minDate}
          max={maxDate}
          error={errors.date || ''}
          required
        />
        <Select
          label="Duration"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          options={durationOptions}
          placeholder="Select duration"
          error={errors.duration_minutes || ''}
          required
        />
      </div>

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What did you work on?"
        rows={3}
        maxLength={VALIDATION.TIME_DESCRIPTION_MAX}
        error={errors.description || ''}
        required
      />

      <div style={{ display: 'flex', gap: spacing[2] }}>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={loading}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

TimeEntryForm.propTypes = {
  initialData: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  taskCreatedAt: PropTypes.string,
  loading: PropTypes.bool,
}

// ── Pencil Icon ──────────────────────────────────────────────────────
function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

// ── Trash Icon ───────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

// ── Clock Icon ───────────────────────────────────────────────────────
function ClockIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ── Entry Row ────────────────────────────────────────────────────────
function TimeEntryRow({ entry, canEdit, onEdit, onDelete }) {
  const rowStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing[3]} 0`,
    borderBottom: `1px solid ${colours.neutral[100]}`,
  }

  const leftStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  }

  const metaStyles = {
    display: 'flex',
    gap: spacing[3],
    alignItems: 'center',
  }

  const dateStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colours.neutral[900],
  }

  const durationStyles = {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    backgroundColor: colours.neutral[100],
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: radii.sm,
  }

  const descStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colours.neutral[700],
    lineHeight: typography.lineHeight.normal,
  }

  const userStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    color: colours.neutral[500],
  }

  const actionsStyles = {
    display: 'flex',
    gap: spacing[1],
    flexShrink: 0,
  }

  const iconBtnStyles = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: spacing[1],
    borderRadius: radii.sm,
    color: colours.neutral[400],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div style={rowStyles}>
      <div style={leftStyles}>
        <div style={metaStyles}>
          <span style={dateStyles}>{formatDate(entry.date)}</span>
          <span style={durationStyles}>{formatDuration(entry.duration_minutes)}</span>
          <span style={userStyles}>{entry.user_name}</span>
        </div>
        <div style={descStyles}>{entry.description}</div>
      </div>

      {canEdit && (
        <div style={actionsStyles}>
          <button
            type="button"
            style={iconBtnStyles}
            onClick={() => onEdit(entry)}
            title="Edit entry"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            style={{ ...iconBtnStyles, color: colours.neutral[600] }}
            onClick={() => onDelete(entry.id)}
            title="Delete entry"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  )
}

TimeEntryRow.propTypes = {
  entry: PropTypes.object.isRequired,
  canEdit: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

// ── Main Component ───────────────────────────────────────────────────
export default function TimeLogSection({
  taskId,
  timeEntries = [],
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  loading = false,
  taskCreatedAt,
}) {
  const { user, hasRole } = useAuth()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState(null)

  const canLogTime = hasRole('contractor', 'admin')

  const totalMinutes = useMemo(
    () => timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0),
    [timeEntries]
  )

  const handleAddSave = (data) => {
    if (onAddEntry) {
      onAddEntry(data)
    }
    setShowAddForm(false)
  }

  const handleEditSave = (data) => {
    if (onUpdateEntry && editingEntryId) {
      onUpdateEntry(editingEntryId, data)
    }
    setEditingEntryId(null)
  }

  const handleDelete = (entryId) => {
    if (onDeleteEntry) {
      onDeleteEntry(entryId)
    }
  }

  const canEditEntry = (entry) => {
    if (hasRole('admin')) return true
    return entry.user_id === user?.id
  }

  // ── Styles ───────────────────────────────────────────────────────
  const containerStyles = {
    padding: spacing[5],
    backgroundColor: colours.white,
    border: `1px solid ${colours.neutral[200]}`,
    borderRadius: radii.lg,
    boxShadow: shadows.sm,
  }

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  }

  const titleStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    margin: 0,
  }

  const totalStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
  }

  const addBtnWrapperStyles = {
    marginBottom: spacing[4],
  }

  const listStyles = {
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <h3 style={titleStyles}>Time Log</h3>
        <span style={totalStyles}>Total: {formatTotalTime(totalMinutes)}</span>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[4] }}>
          <Spinner size="md" />
        </div>
      )}

      {/* Log Time button / Add form */}
      {canLogTime && !showAddForm && !loading && (
        <div style={addBtnWrapperStyles}>
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            Log Time
          </Button>
        </div>
      )}

      {showAddForm && (
        <TimeEntryForm
          onSave={handleAddSave}
          onCancel={() => setShowAddForm(false)}
          taskCreatedAt={taskCreatedAt}
          loading={loading}
        />
      )}

      {/* Entry list */}
      {!loading && timeEntries.length === 0 && (
        <EmptyState
          icon={<ClockIcon />}
          title="No time logged"
          description="Time entries will appear here once work is logged."
        />
      )}

      {!loading && timeEntries.length > 0 && (
        <div style={listStyles}>
          {timeEntries.map(entry => {
            if (editingEntryId === entry.id) {
              return (
                <TimeEntryForm
                  key={entry.id}
                  initialData={entry}
                  onSave={handleEditSave}
                  onCancel={() => setEditingEntryId(null)}
                  taskCreatedAt={taskCreatedAt}
                  loading={loading}
                />
              )
            }

            return (
              <TimeEntryRow
                key={entry.id}
                entry={entry}
                canEdit={canEditEntry(entry)}
                onEdit={() => setEditingEntryId(entry.id)}
                onDelete={handleDelete}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

TimeLogSection.propTypes = {
  taskId: PropTypes.string.isRequired,
  timeEntries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      task_id: PropTypes.string,
      user_id: PropTypes.string,
      user_name: PropTypes.string,
      date: PropTypes.string,
      duration_minutes: PropTypes.number,
      description: PropTypes.string,
      created_at: PropTypes.string,
    })
  ),
  onAddEntry: PropTypes.func,
  onUpdateEntry: PropTypes.func,
  onDeleteEntry: PropTypes.func,
  loading: PropTypes.bool,
  taskCreatedAt: PropTypes.string,
}
