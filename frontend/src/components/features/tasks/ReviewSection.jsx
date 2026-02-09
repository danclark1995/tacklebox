import { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Select, Textarea, EmptyState, Spinner, StarRating } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import {
  TIME_DURATION_OPTIONS,
  TIME_ASSESSMENT,
  TIME_ASSESSMENT_LABELS,
  RATING_MIN,
  RATING_MAX,
  VALIDATION,
} from '@/config/constants'
import { formatDuration } from '@/utils/formatters'
import { colours, spacing, radii, typography, shadows } from '@/config/tokens'

/**
 * ReviewSection
 *
 * Post-task review section for Task Detail after task is closed.
 * Layout varies by role:
 * - Contractor: submit or view their own review
 * - Admin: see both reviews side-by-side, submit admin review
 * - Client: hidden (returns null)
 */

const durationOptions = TIME_DURATION_OPTIONS.map(opt => ({
  value: String(opt.value),
  label: opt.label,
}))

const timeAssessmentOptions = Object.values(TIME_ASSESSMENT).map(val => ({
  value: val,
  label: TIME_ASSESSMENT_LABELS[val],
}))

function formatTotalTime(minutes) {
  if (!minutes || minutes <= 0) return '0h 0m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// ── Styles ─────────────────────────────────────────────────────────

const sectionTitleStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[900],
  margin: 0,
  marginBottom: spacing[5],
}

const cardStyles = {
  padding: spacing[5],
  backgroundColor: colours.white,
  border: `1px solid ${colours.neutral[200]}`,
  borderRadius: radii.lg,
  boxShadow: shadows.sm,
}

const cardNeutralStyles = {
  ...cardStyles,
  backgroundColor: colours.neutral[50],
}

const formFieldStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
  marginBottom: spacing[4],
}

const labelStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colours.neutral[700],
}

const valueStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.base,
  color: colours.neutral[900],
  lineHeight: typography.lineHeight.normal,
}

const mutedTextStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  color: colours.neutral[400],
  fontStyle: 'italic',
}

const noteStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.xs,
  color: colours.warning[600],
  marginTop: spacing[1],
}

const columnHeaderStyles = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[800],
  marginTop: 0,
  marginBottom: spacing[4],
  paddingBottom: spacing[2],
  borderBottom: `2px solid ${colours.primary[100]}`,
}

// ── Read-Only Review Card ────────────────────────────────────────────
function ReviewCard({ review, title }) {
  if (!review) {
    return (
      <div style={cardNeutralStyles}>
        <h4 style={columnHeaderStyles}>{title}</h4>
        <p style={mutedTextStyles}>Pending — review not yet submitted.</p>
      </div>
    )
  }

  const fields = []

  if (review.total_time_minutes != null) {
    fields.push({ label: 'Total Time', value: formatTotalTime(review.total_time_minutes) })
  }

  if (review.difficulty_rating != null) {
    fields.push({
      label: 'Difficulty',
      value: <StarRating value={review.difficulty_rating} readOnly size="sm" />,
    })
  }

  if (review.quality_rating != null) {
    fields.push({
      label: 'Quality Rating',
      value: <StarRating value={review.quality_rating} readOnly size="sm" />,
    })
  }

  if (review.time_assessment) {
    fields.push({
      label: 'Time Assessment',
      value: TIME_ASSESSMENT_LABELS[review.time_assessment] || review.time_assessment,
    })
  }

  if (review.estimated_future_time != null) {
    fields.push({ label: 'Estimated Future Time', value: formatDuration(review.estimated_future_time) })
  }

  if (review.what_went_well) {
    fields.push({ label: 'What went well', value: review.what_went_well })
  }

  if (review.what_to_improve) {
    fields.push({ label: 'What to improve', value: review.what_to_improve })
  }

  if (review.blockers) {
    fields.push({ label: 'Blockers encountered', value: review.blockers })
  }

  if (review.client_feedback) {
    fields.push({ label: 'Client Feedback Summary', value: review.client_feedback })
  }

  if (review.internal_notes) {
    fields.push({ label: 'Internal Notes', value: review.internal_notes })
  }

  return (
    <div style={cardNeutralStyles}>
      <h4 style={columnHeaderStyles}>{title}</h4>
      {fields.map((field, i) => (
        <div key={i} style={{ marginBottom: spacing[3] }}>
          <div style={labelStyles}>{field.label}</div>
          <div style={{ ...valueStyles, marginTop: spacing[1] }}>
            {typeof field.value === 'string' ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>{field.value}</span>
            ) : (
              field.value
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

ReviewCard.propTypes = {
  review: PropTypes.object,
  title: PropTypes.string.isRequired,
}

// ── Contractor Review Form ───────────────────────────────────────────
function ContractorReviewForm({ totalTimeMinutes, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    total_time_minutes: totalTimeMinutes ? String(totalTimeMinutes) : '',
    difficulty_rating: 0,
    what_went_well: '',
    what_to_improve: '',
    blockers: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.total_time_minutes) {
      newErrors.total_time_minutes = 'Total time is required'
    }

    if (formData.difficulty_rating < RATING_MIN || formData.difficulty_rating > RATING_MAX) {
      newErrors.difficulty_rating = `Rating must be between ${RATING_MIN} and ${RATING_MAX}`
    }

    if (!formData.what_went_well || formData.what_went_well.trim().length < 5) {
      newErrors.what_went_well = 'Please describe what went well (at least 5 characters)'
    }

    if (!formData.what_to_improve || formData.what_to_improve.trim().length < 5) {
      newErrors.what_to_improve = 'Please describe what could be improved (at least 5 characters)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate() && onSubmit) {
      onSubmit({
        ...formData,
        total_time_minutes: Number(formData.total_time_minutes),
        what_went_well: formData.what_went_well.trim(),
        what_to_improve: formData.what_to_improve.trim(),
        blockers: formData.blockers.trim() || null,
      })
    }
  }

  return (
    <div style={cardStyles}>
      <h4 style={columnHeaderStyles}>Your Review</h4>

      <div style={formFieldStyles}>
        <label style={labelStyles}>Total Time</label>
        <div style={{
          fontFamily: typography.fontFamily.sans,
          fontSize: typography.fontSize.sm,
          color: colours.neutral[500],
          marginBottom: spacing[1],
        }}>
          Pre-filled from logged time: {formatTotalTime(totalTimeMinutes)}
        </div>
        <Select
          value={formData.total_time_minutes}
          onChange={(e) => handleChange('total_time_minutes', e.target.value)}
          options={durationOptions}
          placeholder="Select total duration"
          error={errors.total_time_minutes || ''}
        />
      </div>

      <div style={formFieldStyles}>
        <label style={labelStyles}>Difficulty Rating</label>
        <StarRating
          value={formData.difficulty_rating}
          onChange={(val) => handleChange('difficulty_rating', val)}
          max={RATING_MAX}
        />
        {errors.difficulty_rating && (
          <span style={{ fontFamily: typography.fontFamily.sans, fontSize: typography.fontSize.xs, color: colours.error[500] }}>
            {errors.difficulty_rating}
          </span>
        )}
      </div>

      <div style={formFieldStyles}>
        <Textarea
          label="What went well?"
          value={formData.what_went_well}
          onChange={(e) => handleChange('what_went_well', e.target.value)}
          placeholder="Describe what went well during this task..."
          rows={3}
          error={errors.what_went_well || ''}
          required
        />
      </div>

      <div style={formFieldStyles}>
        <Textarea
          label="What could be improved?"
          value={formData.what_to_improve}
          onChange={(e) => handleChange('what_to_improve', e.target.value)}
          placeholder="Describe what could be improved..."
          rows={3}
          error={errors.what_to_improve || ''}
          required
        />
      </div>

      <div style={formFieldStyles}>
        <Textarea
          label="Blockers encountered (optional)"
          value={formData.blockers}
          onChange={(e) => handleChange('blockers', e.target.value)}
          placeholder="Any blockers you ran into..."
          rows={2}
        />
      </div>

      <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={loading}>
        Submit Review
      </Button>
    </div>
  )
}

ContractorReviewForm.propTypes = {
  totalTimeMinutes: PropTypes.number,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

// ── Admin Review Form ────────────────────────────────────────────────
function AdminReviewForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    quality_rating: 0,
    time_assessment: '',
    estimated_future_time: '',
    client_feedback: '',
    what_to_improve: '',
    internal_notes: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (formData.quality_rating < RATING_MIN || formData.quality_rating > RATING_MAX) {
      newErrors.quality_rating = `Rating must be between ${RATING_MIN} and ${RATING_MAX}`
    }

    if (!formData.time_assessment) {
      newErrors.time_assessment = 'Time assessment is required'
    }

    if (!formData.estimated_future_time) {
      newErrors.estimated_future_time = 'Estimated future time is required'
    }

    if (!formData.client_feedback || formData.client_feedback.trim().length < 5) {
      newErrors.client_feedback = 'Client feedback summary is required (at least 5 characters)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate() && onSubmit) {
      onSubmit({
        ...formData,
        estimated_future_time: Number(formData.estimated_future_time),
        client_feedback: formData.client_feedback.trim(),
        what_to_improve: formData.what_to_improve.trim() || null,
        internal_notes: formData.internal_notes.trim() || null,
      })
    }
  }

  return (
    <div style={cardStyles}>
      <h4 style={columnHeaderStyles}>Admin Review</h4>

      <div style={formFieldStyles}>
        <label style={labelStyles}>Quality Rating</label>
        <StarRating
          value={formData.quality_rating}
          onChange={(val) => handleChange('quality_rating', val)}
          max={RATING_MAX}
        />
        {errors.quality_rating && (
          <span style={{ fontFamily: typography.fontFamily.sans, fontSize: typography.fontSize.xs, color: colours.error[500] }}>
            {errors.quality_rating}
          </span>
        )}
      </div>

      <div style={formFieldStyles}>
        <Select
          label="Time Assessment"
          value={formData.time_assessment}
          onChange={(e) => handleChange('time_assessment', e.target.value)}
          options={timeAssessmentOptions}
          placeholder="Select assessment"
          error={errors.time_assessment || ''}
          required
        />
      </div>

      <div style={formFieldStyles}>
        <Select
          label="Estimated Future Time"
          value={formData.estimated_future_time}
          onChange={(e) => handleChange('estimated_future_time', e.target.value)}
          options={durationOptions}
          placeholder="Select duration"
          error={errors.estimated_future_time || ''}
          required
        />
      </div>

      <div style={formFieldStyles}>
        <Textarea
          label="Client Feedback Summary"
          value={formData.client_feedback}
          onChange={(e) => handleChange('client_feedback', e.target.value)}
          placeholder="Summarise client feedback..."
          rows={3}
          error={errors.client_feedback || ''}
          required
        />
      </div>

      <div style={formFieldStyles}>
        <Textarea
          label="What to improve"
          value={formData.what_to_improve}
          onChange={(e) => handleChange('what_to_improve', e.target.value)}
          placeholder="Areas for improvement..."
          rows={3}
        />
      </div>

      <div style={formFieldStyles}>
        <Textarea
          label="Internal Notes"
          value={formData.internal_notes}
          onChange={(e) => handleChange('internal_notes', e.target.value)}
          placeholder="Internal notes (not shared externally)..."
          rows={3}
        />
        <span style={noteStyles}>Only visible to admins</span>
      </div>

      <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={loading}>
        Submit Review
      </Button>
    </div>
  )
}

AdminReviewForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

// ── Main Component ───────────────────────────────────────────────────
export default function ReviewSection({
  taskId,
  reviews = [],
  totalTimeMinutes = 0,
  onSubmitReview,
  loading = false,
}) {
  const { user, hasRole } = useAuth()

  const isAdmin = hasRole('admin')
  const isContractor = hasRole('contractor')
  const isClient = hasRole('client')

  // Clients should not see review section
  if (isClient && !isAdmin) return null

  const contractorReview = reviews.find(r => r.reviewer_role === 'contractor')
  const adminReview = reviews.find(r => r.reviewer_role === 'admin')

  if (loading) {
    return (
      <div>
        <h2 style={sectionTitleStyles}>Post-Task Review</h2>
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  // ── Contractor View ────────────────────────────────────────────────
  if (isContractor && !isAdmin) {
    return (
      <div>
        <h2 style={sectionTitleStyles}>Post-Task Review</h2>
        {contractorReview ? (
          <ReviewCard review={contractorReview} title="Your Review" />
        ) : (
          <ContractorReviewForm
            totalTimeMinutes={totalTimeMinutes}
            onSubmit={(data) => {
              if (onSubmitReview) {
                onSubmitReview({ ...data, reviewer_role: 'contractor' })
              }
            }}
            loading={loading}
          />
        )}
      </div>
    )
  }

  // ── Admin View ─────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div>
        <h2 style={sectionTitleStyles}>Post-Task Review</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing[6],
        }}>
          {/* Left column: contractor review */}
          <ReviewCard
            review={contractorReview}
            title="Camper Review"
          />

          {/* Right column: admin review form or read-only */}
          {adminReview ? (
            <ReviewCard review={adminReview} title="Admin Review" />
          ) : (
            <AdminReviewForm
              onSubmit={(data) => {
                if (onSubmitReview) {
                  onSubmitReview({ ...data, reviewer_role: 'admin' })
                }
              }}
              loading={loading}
            />
          )}
        </div>
      </div>
    )
  }

  // Fallback — should not be reached given role checks above
  return null
}

ReviewSection.propTypes = {
  taskId: PropTypes.string.isRequired,
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      task_id: PropTypes.string,
      reviewer_role: PropTypes.string,
      total_time_minutes: PropTypes.number,
      difficulty_rating: PropTypes.number,
      quality_rating: PropTypes.number,
      time_assessment: PropTypes.string,
      estimated_future_time: PropTypes.number,
      what_went_well: PropTypes.string,
      what_to_improve: PropTypes.string,
      blockers: PropTypes.string,
      client_feedback: PropTypes.string,
      internal_notes: PropTypes.string,
    })
  ),
  totalTimeMinutes: PropTypes.number,
  onSubmitReview: PropTypes.func,
  loading: PropTypes.bool,
}
