import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import Spinner from '@/components/ui/Spinner'
import TaskDetail from '@/components/features/tasks/TaskDetail'
import { apiFetch } from '@/services/apiFetch'
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
        const [taskJson, commentsJson, attachmentsJson] = await Promise.all([
          apiFetch(`/tasks/${id}`),
          apiFetch(`/comments?task_id=${id}`),
          apiFetch(`/attachments?task_id=${id}`),
        ])
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
      const json = await apiFetch('/comments', {
        method: 'POST',
        body: JSON.stringify({
          task_id: id,
          text: commentData.content,
          visibility: 'all'
        }),
      })

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
