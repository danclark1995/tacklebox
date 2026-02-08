import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import TaskDetail from '@/components/features/tasks/TaskDetail'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function AdminTaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [task, setTask] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState('')
  const [revisionNote, setRevisionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, commentsRes, attachmentsRes, usersRes] = await Promise.all([
          fetch(apiEndpoint(`/tasks/${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/comments?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/attachments?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/users?role=contractor'), { headers: { ...getAuthHeaders() } })
        ])

        const taskJson = await taskRes.json()
        const commentsJson = await commentsRes.json()
        const attachmentsJson = await attachmentsRes.json()
        const usersJson = await usersRes.json()

        if (taskJson.success) setTask(taskJson.data)
        if (commentsJson.success) setComments(commentsJson.data)
        if (attachmentsJson.success) setAttachments(attachmentsJson.data)
        if (usersJson.success) setContractors(usersJson.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, addToast])

  const handleAssign = async () => {
    if (!selectedContractor) {
      addToast('Please select a contractor', 'error')
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

  const renderAdminActions = () => {
    return (
      <div style={actionsStyle}>
        {task.status === 'submitted' && (
          <Button onClick={() => setShowAssignModal(true)}>
            Assign to Contractor
          </Button>
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
          <Button variant="secondary" onClick={() => navigate(`/tasks/${id}/edit`)}>
            Edit Task
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      <Link to="/tasks" style={backLinkStyle}>
        ← Back to Tasks
      </Link>

      {renderAdminActions()}

      <TaskDetail
        task={task}
        comments={comments}
        attachments={attachments}
        onAddComment={handleAddComment}
        userRole="admin"
        commentVisibilityOptions={[
          { value: 'all', label: 'Visible to All' },
          { value: 'internal', label: 'Internal Only' }
        ]}
      />

      {showAssignModal && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title="Assign Task to Contractor"
        >
          <div style={{ padding: spacing[4] }}>
            <Select
              label="Select Contractor"
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              options={[
                { value: '', label: 'Select a contractor...' },
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
              label="Feedback for Contractor"
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
    </div>
  )
}
