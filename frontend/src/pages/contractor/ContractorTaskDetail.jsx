import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Undo2 } from 'lucide-react'
import useToast from '@/hooks/useToast'
import EmberLoader from '@/components/ui/EmberLoader'
import Button from '@/components/ui/Button'
import ConfirmAction from '@/components/ui/ConfirmAction'
import FileUpload from '@/components/ui/FileUpload'
import Select from '@/components/ui/Select'
import TaskDetail from '@/components/features/tasks/TaskDetail'
import BrandBooklet from '@/components/features/brand/BrandBooklet'
import AIAssistantPanel from '@/components/features/tasks/AIAssistantPanel'
import { getTask, updateTaskStatus, passTask, getTaskHistory } from '@/services/tasks'
import { listComments, createComment } from '@/services/comments'
import { listAttachments, uploadAttachment, deleteAttachment } from '@/services/attachments'
import { listEntries as listTimeEntries, createEntry as createTimeEntry, updateEntry as updateTimeEntry, deleteEntry as deleteTimeEntry, getTotal as getTimeTotal } from '@/services/timeEntries'
import { listReviews, createReview } from '@/services/reviews'
import { getProfile as getBrandProfile, getLogos } from '@/services/brands'
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
          const data = await getBrandProfile(task.client_id)
          setBrandProfile(data)
        } catch { /* brand profile may not exist */ }
      }
      fetchBrand()
    }
  }, [task?.id, task?.status, task?.client_id])

  useEffect(() => {
    async function load() {
      try {
        const [taskData, commentsData, attachmentsData, timeEntriesData, reviewsData, totalTimeData, historyData] = await Promise.all([
          getTask(id).catch(() => null),
          listComments(id).catch(() => null),
          listAttachments(id).catch(() => null),
          listTimeEntries(id).catch(() => null),
          listReviews(id).catch(() => null),
          getTimeTotal(id).catch(() => null),
          getTaskHistory(id).catch(() => null),
        ])
        if (taskData) setTask(taskData)
        if (commentsData) setComments(commentsData)
        if (attachmentsData) setAttachments(attachmentsData)
        if (timeEntriesData) setTimeEntries(timeEntriesData)
        if (reviewsData) setReviews(reviewsData)
        if (totalTimeData) setTotalTimeMinutes(totalTimeData.total_minutes)
        if (historyData) setHistory(historyData)
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
      await updateTaskStatus(id, newStatus)
      setTask({ ...task, status: newStatus })
      addToast('Task status updated', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleAddComment = async (commentData) => {
    try {
      const data = await createComment({
        task_id: id,
        text: commentData.content,
        visibility: commentData.visibility || 'all'
      })
      setComments([...comments, data])
      addToast('Comment added', 'success')
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

      const data = await uploadAttachment(formData)
      setAttachments([...attachments, ...data])
      addToast('Files uploaded successfully', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleAddTimeEntry = async (data) => {
    setSubmitting(true)
    try {
      const entry = await createTimeEntry({ task_id: id, ...data })
      setTimeEntries([...timeEntries, entry])
      setTotalTimeMinutes(totalTimeMinutes + (data.duration_minutes || 0))
      addToast('Time entry added', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateTimeEntry = async (entryId, data) => {
    setSubmitting(true)
    try {
      const updated = await updateTimeEntry(entryId, data)
      setTimeEntries(timeEntries.map((e) => (e.id === entryId ? updated : e)))
      const totalData = await getTimeTotal(id)
      setTotalTimeMinutes(totalData.total_minutes)
      addToast('Time entry updated', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTimeEntry = async (entryId) => {
    setSubmitting(true)
    try {
      await deleteTimeEntry(entryId)
      const removed = timeEntries.find((e) => e.id === entryId)
      setTimeEntries(timeEntries.filter((e) => e.id !== entryId))
      if (removed) setTotalTimeMinutes(totalTimeMinutes - (removed.duration_minutes || 0))
      addToast('Time entry deleted', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReview = async (reviewData) => {
    setSubmitting(true)
    try {
      const data = await createReview({ task_id: id, ...reviewData })
      setReviews([...reviews, data])
      addToast('Review submitted', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    setSubmitting(true)
    try {
      await deleteAttachment(attachmentId)
      setAttachments(attachments.filter((a) => a.id !== attachmentId))
      addToast('Attachment deleted', 'success')
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
      await passTask(id)
      addToast('Task returned to the campfire', 'success')
      navigate('/camper/tasks')
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
      const data = await getBrandProfile(task.client_id)
      setBrandProfile(data)
      try {
        const logosData = await getLogos(task.client_id)
        setBrandLogos(logosData || [])
      } catch { /* logos may not exist yet */ }
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
            <ConfirmAction
              trigger={
                <Button variant="secondary" icon={<Undo2 size={14} />}>Pass</Button>
              }
              message="Return this task to the campfire?"
              confirmLabel={passing ? 'Passing...' : 'Confirm'}
              onConfirm={handlePass}
            />
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
