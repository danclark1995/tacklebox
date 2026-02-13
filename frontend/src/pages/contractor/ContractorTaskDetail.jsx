import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Undo2 } from 'lucide-react'
import useToast from '@/hooks/useToast'
import EmberLoader from '@/components/ui/EmberLoader'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'
import Select from '@/components/ui/Select'
import TaskDetail from '@/components/features/tasks/TaskDetail'
import BrandBooklet from '@/components/features/brand/BrandBooklet'
import AIAssistantPanel from '@/components/features/tasks/AIAssistantPanel'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'
import { COMMENT_VISIBILITY } from '@/config/constants'

export default function ContractorTaskDetail() {
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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showBrandProfile, setShowBrandProfile] = useState(false)
  const [brandProfile, setBrandProfile] = useState(null)
  const [brandLogos, setBrandLogos] = useState([])
  const [loadingBrandProfile, setLoadingBrandProfile] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmingPass, setConfirmingPass] = useState(false)
  const [passing, setPassing] = useState(false)

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

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, commentsRes, attachmentsRes, timeEntriesRes, reviewsRes, totalTimeRes, historyRes] = await Promise.all([
          fetch(apiEndpoint(`/tasks/${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/comments?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/attachments?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/time-entries?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/reviews?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/time-entries/total?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/task-history?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
        ])

        const taskJson = await taskRes.json()
        const commentsJson = await commentsRes.json()
        const attachmentsJson = await attachmentsRes.json()
        const timeEntriesJson = await timeEntriesRes.json()
        const reviewsJson = await reviewsRes.json()
        const totalTimeJson = await totalTimeRes.json()
        const historyJson = await historyRes.json()

        if (taskJson.success) setTask(taskJson.data)
        if (commentsJson.success) setComments(commentsJson.data)
        if (attachmentsJson.success) setAttachments(attachmentsJson.data)
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

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(apiEndpoint(`/tasks/${id}/status`), {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
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
    }
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
          content: commentData.content,
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

  const handleFileUpload = async (filesOrFile) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('task_id', id)
      formData.append('upload_type', 'deliverable')
      const fileList = Array.isArray(filesOrFile) ? filesOrFile : [filesOrFile]
      for (const file of fileList) {
        formData.append('files', file)
      }

      const res = await fetch(apiEndpoint('/attachments'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
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
      setUploading(false)
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

  const handleAIAttachmentAdded = (newAttachment) => {
    setAttachments(prev => [...prev, newAttachment])
  }

  const handlePass = async () => {
    setPassing(true)
    try {
      const res = await fetch(apiEndpoint(`/tasks/${id}/pass`), {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      })
      const json = await res.json()
      if (json.success) {
        addToast('Task returned to the campfire', 'success')
        navigate('/camper/tasks')
      } else {
        addToast(json.error || 'Failed to pass on task', 'error')
        setConfirmingPass(false)
      }
    } catch (err) {
      addToast(err.message, 'error')
      setConfirmingPass(false)
    } finally {
      setPassing(false)
    }
  }

  const handleViewBrandProfile = async () => {
    if (!task?.client_id) return

    setShowBrandProfile(true)
    setLoadingBrandProfile(true)
    try {
      const res = await fetch(apiEndpoint(`/brand-profiles/${task.client_id}`), {
        headers: { ...getAuthHeaders() }
      })
      const json = await res.json()
      if (json.success) {
        setBrandProfile(json.data)
        try {
          const logosRes = await fetch(apiEndpoint(`/brand-profiles/${task.client_id}/logos`), { headers: { ...getAuthHeaders() } })
          const logosJson = await logosRes.json()
          if (logosJson.success) setBrandLogos(logosJson.data || [])
        } catch { /* logos may not exist yet */ }
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoadingBrandProfile(false)
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

  const renderContractorActions = () => {
    return (
      <div style={actionsStyle}>
        {task.status === 'assigned' && (
          <>
            <Button onClick={() => handleStatusChange('in_progress')}>
              Start Work
            </Button>
            {!confirmingPass ? (
              <Button variant="secondary" onClick={() => setConfirmingPass(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Undo2 size={14} />
                Pass
              </Button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: colours.neutral[500] }}>Return this task to the campfire?</span>
                <button
                  onClick={handlePass}
                  disabled={passing}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#111111',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '12px',
                    padding: '6px 16px',
                    cursor: passing ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: passing ? 0.7 : 1,
                  }}
                >
                  {passing ? 'Passing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmingPass(false)}
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
          </>
        )}

        {task.status === 'in_progress' && (
          <>
            <FileUpload
              onUpload={handleFileUpload}
              multiple
              disabled={uploading}
            />
            <Button onClick={() => handleStatusChange('review')}>
              Submit for Review
            </Button>
          </>
        )}

        {task.status === 'revision' && (
          <Button onClick={() => handleStatusChange('in_progress')}>
            Resume Work
          </Button>
        )}

        <Button variant="secondary" onClick={handleViewBrandProfile}>
          View Client's Brand Profile
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Link to="/camper/tasks" style={backLinkStyle}>
        ← Back to Tasks
      </Link>

      {renderContractorActions()}

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

      {/* Brand Profile Booklet */}
      {showBrandProfile && !loadingBrandProfile && brandProfile && (
        <BrandBooklet
          brandProfile={brandProfile}
          clientName={task?.client_name}
          companyName={brandProfile.client_company}
          logos={brandLogos}
          onClose={() => setShowBrandProfile(false)}
        />
      )}
    </div>
  )
}
