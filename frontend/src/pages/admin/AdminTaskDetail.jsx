import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Cpu } from 'lucide-react'
import useToast from '@/hooks/useToast'
import EmberLoader from '@/components/ui/EmberLoader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import GlowCard from '@/components/ui/GlowCard'
import TaskDetail from '@/components/features/tasks/TaskDetail'
import AIAssistantPanel from '@/components/features/tasks/AIAssistantPanel'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { SCALING_TIERS } from '@/config/constants'
import { spacing, colours, typography } from '@/config/tokens'

export default function AdminTaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [task, setTask] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [timeEntries, setTimeEntries] = useState([])
  const [reviews, setReviews] = useState([])
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(0)
  const [history, setHistory] = useState([])
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState('')
  const [revisionNote, setRevisionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [brandProfile, setBrandProfile] = useState(null)
  const [complexityLevel, setComplexityLevel] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleComplexityChange = async (value) => {
    const newLevel = value === '' ? null : Number(value)
    setComplexityLevel(newLevel)
    try {
      const res = await fetch(apiEndpoint(`/tasks/${id}`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ complexity_level: newLevel }),
      })
      const json = await res.json()
      if (json.success) {
        setTask(json.data)
        addToast('Complexity level updated', 'success')
      } else {
        addToast(json.error || 'Failed to update', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, commentsRes, attachmentsRes, usersRes, timeEntriesRes, reviewsRes, totalTimeRes, historyRes] = await Promise.all([
          fetch(apiEndpoint(`/tasks/${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/comments?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/attachments?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/users?role=contractor'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/time-entries?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/reviews?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/time-entries/total?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/task-history?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
        ])

        const taskJson = await taskRes.json()
        const commentsJson = await commentsRes.json()
        const attachmentsJson = await attachmentsRes.json()
        const usersJson = await usersRes.json()
        const timeEntriesJson = await timeEntriesRes.json()
        const reviewsJson = await reviewsRes.json()
        const totalTimeJson = await totalTimeRes.json()
        const historyJson = await historyRes.json()

        if (taskJson.success) {
          setTask(taskJson.data)
          setComplexityLevel(taskJson.data?.complexity_level ?? null)
          if (taskJson.data?.ai_metadata) {
            try {
              setAiAnalysis(JSON.parse(taskJson.data.ai_metadata))
            } catch {
              setAiAnalysis(taskJson.data.ai_metadata)
            }
          }
        }
        if (commentsJson.success) setComments(commentsJson.data)
        if (attachmentsJson.success) setAttachments(attachmentsJson.data)
        if (usersJson.success) setContractors(usersJson.data)
        if (timeEntriesJson.success) setTimeEntries(timeEntriesJson.data)
        if (reviewsJson.success) setReviews(reviewsJson.data)
        if (totalTimeJson.success) setTotalTimeMinutes(totalTimeJson.data.total_minutes)
        if (historyJson.success) setHistory(historyJson.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, addToast])

  // Auto-fetch brand profile for AI panel
  useEffect(() => {
    const activeStatuses = ['in_progress', 'review', 'revision']
    if (task && task.client_id && activeStatuses.includes(task.status)) {
      async function fetchBrand() {
        try {
          const res = await fetch(apiEndpoint(`/brand-profiles/${task.client_id}`), {
            headers: { ...getAuthHeaders() }
          })
          const json = await res.json()
          if (json.success) setBrandProfile(json.data)
        } catch { /* brand profile may not exist */ }
      }
      fetchBrand()
    }
  }, [task?.id, task?.status, task?.client_id])

  const handleAIAttachmentAdded = (newAttachment) => {
    setAttachments(prev => [...prev, newAttachment])
  }

  const handleDeleteTask = async () => {
    setDeleting(true)
    try {
      const res = await fetch(apiEndpoint(`/tasks/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      })
      const json = await res.json()
      if (json.success) {
        addToast('Task deleted', 'success')
        navigate('/admin/tasks')
      } else {
        addToast(json.error || 'Failed to delete task', 'error')
        setConfirmingDelete(false)
      }
    } catch (err) {
      addToast(err.message, 'error')
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedContractor) {
      addToast('Please select a camper', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint(`/tasks/${id}/status`), {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'assigned',
          contractor_id: selectedContractor
        })
      })

      const json = await res.json()

      if (json.success) {
        setTask({ ...task, status: 'assigned', contractor_id: selectedContractor })
        setShowAssignModal(false)
        addToast('Task assigned successfully', 'success')
      } else {
        addToast(json.message || 'Failed to assign task', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus, additionalData = {}) => {
    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint(`/tasks/${id}/status`), {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData
        })
      })

      const json = await res.json()

      if (json.success) {
        setTask({ ...task, status: newStatus })
        addToast('Task status updated', 'success')
      } else {
        addToast(json.message || 'Failed to update status', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevision = async () => {
    if (!revisionNote.trim()) {
      addToast('Please provide feedback for the revision', 'error')
      return
    }

    await handleStatusChange('revision', { feedback: revisionNote })
    setShowRevisionModal(false)
    setRevisionNote('')
  }

  const handleAddComment = async (commentData) => {
    try {
      const res = await fetch(apiEndpoint('/comments'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_id: id,
          text: commentData.text,
          visibility: commentData.visibility || 'all'
        })
      })

      const json = await res.json()

      if (json.success) {
        setComments([...comments, json.data])
        addToast('Comment added', 'success')
      } else {
        addToast(json.message || 'Failed to add comment', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleAddTimeEntry = async (data) => {
    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint('/time-entries'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: id, ...data }),
      })

      const json = await res.json()

      if (json.success) {
        setTimeEntries([...timeEntries, json.data])
        setTotalTimeMinutes(totalTimeMinutes + (data.duration_minutes || 0))
        addToast('Time entry added', 'success')
      } else {
        addToast(json.message || 'Failed to add time entry', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateTimeEntry = async (entryId, data) => {
    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint(`/time-entries/${entryId}`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (json.success) {
        setTimeEntries(timeEntries.map((e) => (e.id === entryId ? json.data : e)))
        // Recalculate total
        const totalRes = await fetch(apiEndpoint(`/time-entries/total?task_id=${id}`), {
          headers: { ...getAuthHeaders() },
        })
        const totalJson = await totalRes.json()
        if (totalJson.success) setTotalTimeMinutes(totalJson.data.total_minutes)
        addToast('Time entry updated', 'success')
      } else {
        addToast(json.message || 'Failed to update time entry', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTimeEntry = async (entryId) => {
    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint(`/time-entries/${entryId}`), {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      })

      const json = await res.json()

      if (json.success) {
        const removed = timeEntries.find((e) => e.id === entryId)
        setTimeEntries(timeEntries.filter((e) => e.id !== entryId))
        if (removed) setTotalTimeMinutes(totalTimeMinutes - (removed.duration_minutes || 0))
        addToast('Time entry deleted', 'success')
      } else {
        addToast(json.message || 'Failed to delete time entry', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReview = async (reviewData) => {
    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint('/reviews'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: id, ...reviewData }),
      })

      const json = await res.json()

      if (json.success) {
        setReviews([...reviews, json.data])
        addToast('Review submitted', 'success')
      } else {
        addToast(json.message || 'Failed to submit review', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (files) => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('task_id', id)
      formData.append('upload_type', 'deliverable')
      for (const file of files) {
        formData.append('files', file)
      }

      const res = await fetch(apiEndpoint('/attachments'), {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData,
      })

      const json = await res.json()

      if (json.success) {
        setAttachments([...attachments, ...json.data])
        addToast('Files uploaded successfully', 'success')
      } else {
        addToast(json.message || 'Failed to upload files', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint(`/attachments/${attachmentId}`), {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      })

      const json = await res.json()

      if (json.success) {
        setAttachments(attachments.filter((a) => a.id !== attachmentId))
        addToast('Attachment deleted', 'success')
      } else {
        addToast(json.message || 'Failed to delete attachment', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAIAnalysis = async () => {
    setAiLoading(true)
    try {
      const res = await fetch(apiEndpoint(`/ai/analyse-brief/${id}`), {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      })
      const json = await res.json()
      if (json.success) {
        setAiAnalysis(json.data)
        addToast('AI analysis complete', 'success')
      } else {
        addToast(json.error || 'AI analysis failed', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  if (!task) {
    return (
      <div style={{ textAlign: 'center', padding: spacing[8] }}>
        <p style={{ color: colours.neutral[600] }}>Task not found</p>
      </div>
    )
  }

  const backLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    color: colours.neutral[900],
    textDecoration: 'none',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[4],
  }

  const actionsStyle = {
    display: 'flex',
    gap: spacing[3],
    marginBottom: spacing[4],
  }

  const renderAdminActions = () => {
    return (
      <div style={actionsStyle}>
        {task.status === 'submitted' && (
          <>
            <Button onClick={() => setShowAssignModal(true)}>
              Assign to Camper
            </Button>
            <Button variant="secondary" onClick={handleAIAnalysis} disabled={aiLoading}>
              {aiLoading ? 'Analysing...' : 'AI Analysis'}
            </Button>
          </>
        )}

        {task.status === 'review' && (
          <>
            <Button onClick={() => handleStatusChange('approved')}>
              Approve
            </Button>
            <Button variant="secondary" onClick={() => setShowRevisionModal(true)}>
              Request Revision
            </Button>
          </>
        )}

        {task.status === 'approved' && (
          <Button onClick={() => handleStatusChange('closed')}>
            Close Task
          </Button>
        )}

        {task.status !== 'closed' && (
          <Button variant="secondary" onClick={() => navigate(`/admin/tasks/${id}/edit`)}>
            Edit Task
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      <Link to="/admin/tasks" style={backLinkStyle}>
        ← Back to Tasks
      </Link>

      {renderAdminActions()}

      {/* Complexity Level Selector */}
      {task.status !== 'closed' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          marginBottom: spacing[4],
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colours.neutral[700],
            whiteSpace: 'nowrap',
          }}>
            {complexityLevel === 0 && <Cpu size={14} />}
            Complexity Level
          </div>
          <div style={{ width: '320px' }}>
            <Select
              value={complexityLevel != null ? String(complexityLevel) : ''}
              onChange={(e) => handleComplexityChange(e.target.value)}
              options={complexityOptions}
            />
          </div>
          {complexityLevel != null && (() => {
            const tier = SCALING_TIERS.find(t => t.level === complexityLevel)
            return tier ? (
              <span style={{
                fontSize: typography.fontSize.xs,
                color: colours.neutral[500],
              }}>
                {tier.description}
              </span>
            ) : null
          })()}
        </div>
      )}

      {/* Complexity Level Display (closed tasks) */}
      {task.status === 'closed' && complexityLevel != null && (() => {
        const tier = SCALING_TIERS.find(t => t.level === complexityLevel)
        return tier ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: typography.fontSize.sm,
            color: colours.neutral[600],
            marginBottom: spacing[4],
          }}>
            {complexityLevel === 0 && <Cpu size={14} />}
            Level {tier.level} — {tier.name}
          </div>
        ) : null
      })()}

      {(aiAnalysis || task.ai_metadata) && (
        <GlowCard style={{ marginBottom: spacing[4], padding: spacing[4] }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: spacing[3], color: colours.neutral[800] }}>
            AI Brief Analysis
          </h3>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: colours.neutral[700] }}>
            {typeof (aiAnalysis || task.ai_metadata) === 'string'
              ? (aiAnalysis || task.ai_metadata)
              : JSON.stringify(aiAnalysis || task.ai_metadata, null, 2)}
          </div>
        </GlowCard>
      )}

      <AIAssistantPanel
        task={task}
        brandProfile={brandProfile}
        onAttachmentAdded={handleAIAttachmentAdded}
        complexityLevel={task?.complexity_level}
      />

      <TaskDetail
        task={task}
        comments={comments}
        attachments={attachments}
        timeEntries={timeEntries}
        reviews={reviews}
        totalTimeMinutes={totalTimeMinutes}
        history={history}
        onStatusChange={handleStatusChange}
        onComment={handleAddComment}
        onFileUpload={handleFileUpload}
        onDeleteAttachment={handleDeleteAttachment}
        onAddTimeEntry={handleAddTimeEntry}
        onUpdateTimeEntry={handleUpdateTimeEntry}
        onDeleteTimeEntry={handleDeleteTimeEntry}
        onSubmitReview={handleSubmitReview}
        loading={submitting}
      />

      {showAssignModal && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title="Assign Task to Camper"
        >
          <div style={{ padding: spacing[4] }}>
            <Select
              label="Select Camper"
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              options={[
                { value: '', label: 'Select a camper...' },
                ...contractors.map(c => ({
                  value: c.id,
                  label: c.display_name || c.name
                }))
              ]}
            />

            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end', marginTop: spacing[6] }}>
              <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={submitting || !selectedContractor}>
                {submitting ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showRevisionModal && (
        <Modal
          isOpen={showRevisionModal}
          onClose={() => setShowRevisionModal(false)}
          title="Request Revision"
        >
          <div style={{ padding: spacing[4] }}>
            <Textarea
              label="Feedback for Camper"
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Explain what needs to be revised..."
              rows={6}
            />

            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end', marginTop: spacing[6] }}>
              <Button variant="secondary" onClick={() => setShowRevisionModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleRevision} disabled={submitting || !revisionNote.trim()}>
                {submitting ? 'Submitting...' : 'Request Revision'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Task */}
      <div style={{ marginTop: spacing[8], paddingTop: spacing[6], borderTop: '1px solid #1a1a1a' }}>
        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            style={{
              background: 'transparent',
              color: '#ff4444',
              border: '1px solid #ff4444',
              borderRadius: '6px',
              fontSize: '13px',
              padding: '8px 20px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
            }}
          >
            Delete Task
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: colours.neutral[500] }}>
              Delete this task? This cannot be undone.
            </span>
            <button
              onClick={handleDeleteTask}
              disabled={deleting}
              style={{
                backgroundColor: '#ff4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                padding: '6px 16px',
                cursor: deleting ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
                opacity: deleting ? 0.7 : 1,
              }}
            >
              {deleting ? 'Deleting...' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              style={{
                backgroundColor: 'transparent',
                color: colours.neutral[500],
                border: '1px solid #333',
                borderRadius: '6px',
                fontSize: '12px',
                padding: '6px 16px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
