import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FileUpload from '@/components/ui/FileUpload'
import Select from '@/components/ui/Select'
import TaskDetail from '@/components/features/tasks/TaskDetail'
import BrandProfileView from '@/components/features/brand/BrandProfileView'
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
  const [loading, setLoading] = useState(true)
  const [showBrandProfile, setShowBrandProfile] = useState(false)
  const [brandProfile, setBrandProfile] = useState(null)
  const [loadingBrandProfile, setLoadingBrandProfile] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, commentsRes, attachmentsRes] = await Promise.all([
          fetch(apiEndpoint(`/tasks/${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/comments?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/attachments?task_id=${id}`), { headers: { ...getAuthHeaders() } })
        ])

        const taskJson = await taskRes.json()
        const commentsJson = await commentsRes.json()
        const attachmentsJson = await attachmentsRes.json()

        if (taskJson.success) setTask(taskJson.data)
        if (commentsJson.success) setComments(commentsJson.data)
        if (attachmentsJson.success) setAttachments(attachmentsJson.data)
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

  const handleFileUpload = async (files) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('task_id', id)
      formData.append('upload_type', 'deliverable')
      for (const file of files) {
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

  const handleViewBrandProfile = async () => {
    if (!task?.client_id) return

    setShowBrandProfile(true)
    setLoadingBrandProfile(true)
    try {
      const res = await fetch(apiEndpoint(`/brand-profiles/${task.client_id}`), {
        headers: { ...getAuthHeaders() }
      })
      const json = await res.json()
      if (json.success) setBrandProfile(json.data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoadingBrandProfile(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <Spinner size="lg" />
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
    color: colours.primary[500],
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
          <Button onClick={() => handleStatusChange('in_progress')}>
            Start Work
          </Button>
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
      <Link to="/tasks" style={backLinkStyle}>
        ← Back to Tasks
      </Link>

      {renderContractorActions()}

      <TaskDetail
        task={task}
        comments={comments}
        attachments={attachments}
        onAddComment={handleAddComment}
        userRole="contractor"
        commentVisibilityOptions={[
          { value: 'all', label: 'Visible to All' },
          { value: 'internal', label: 'Internal Only' }
        ]}
      />

      {showBrandProfile && (
        <Modal
          isOpen={showBrandProfile}
          onClose={() => setShowBrandProfile(false)}
          title="Client Brand Profile"
        >
          <div style={{ padding: spacing[4] }}>
            {loadingBrandProfile ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
                <Spinner size="md" />
              </div>
            ) : brandProfile ? (
              <BrandProfileView profile={brandProfile} />
            ) : (
              <p style={{ color: colours.neutral[600], textAlign: 'center' }}>
                No brand profile available
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
