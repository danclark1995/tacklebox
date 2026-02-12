import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import EmberLoader from '@/components/ui/EmberLoader'
import TaskDetail from '@/components/features/tasks/TaskDetail'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, colours, typography } from '@/config/tokens'

export default function ClientTaskDetail() {
  const { id } = useParams()
  const { addToast } = useToast()
  const [task, setTask] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, commentsRes, attachmentsRes] = await Promise.all([
          fetch(apiEndpoint(`/tasks/${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/comments?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint(`/attachments?task_id=${id}`), { headers: { ...getAuthHeaders() } }),
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
          text: commentData.content,
          visibility: 'all'
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

  return (
    <div>
      <Link to="/client/tasks" style={backLinkStyle}>
        ← Back to Tasks
      </Link>
      <TaskDetail
        task={task}
        comments={comments}
        attachments={attachments}
        onComment={handleAddComment}
        loading={false}
      />
    </div>
  )
}
